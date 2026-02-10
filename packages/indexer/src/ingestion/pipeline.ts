import type { PapiClient } from "../client.js";
import type { PluginRegistry } from "../plugins/registry.js";
import { processBlock, type RawBlockData } from "./block-processor.js";
import {
  getLastFinalizedHeight,
  upsertIndexerState,
  finalizeBlock,
} from "@polka-xplo/db";
import type { BlockStatus } from "@polka-xplo/shared";

/**
 * The Ingestion Pipeline manages the dual-stream architecture:
 * 1. The Canonical (Finalized) Stream — source of truth
 * 2. The Live (Best Head) Stream — optimistic updates
 *
 * It also handles backfilling gaps when the indexer restarts.
 *
 * PAPI PolkadotClient API used:
 * - client.finalizedBlock$        → Observable<BlockInfo>  { hash, number, parent }
 * - client.bestBlocks$            → Observable<BlockInfo[]> [best, ..., finalized]
 * - client.getFinalizedBlock()    → Promise<BlockInfo>
 * - client.getBestBlocks()        → Promise<BlockInfo[]>
 * - client.getBlockHeader(hash?)  → Promise<BlockHeader>   { parentHash, number, stateRoot, extrinsicRoot, digests }
 * - client.getBlockBody(hash)     → Promise<HexString[]>   (SCALE-encoded extrinsics)
 */
export class IngestionPipeline {
  private papiClient: PapiClient;
  private registry: PluginRegistry;
  private chainId: string;
  private running = false;
  private finalizedUnsub: (() => void) | null = null;
  private bestUnsub: (() => void) | null = null;

  constructor(papiClient: PapiClient, registry: PluginRegistry) {
    this.papiClient = papiClient;
    this.registry = registry;
    this.chainId = papiClient.chainConfig.id;
  }

  /** Start the ingestion pipeline */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    console.log(`[Pipeline:${this.chainId}] Starting ingestion pipeline...`);

    // Phase 1: Backfill any missed finalized blocks
    await this.backfill();

    // Phase 2: Subscribe to live streams
    this.subscribeFinalized();
    this.subscribeBestHead();

    console.log(`[Pipeline:${this.chainId}] Pipeline is live.`);
  }

  /** Stop the pipeline gracefully */
  async stop(): Promise<void> {
    this.running = false;
    if (this.finalizedUnsub) this.finalizedUnsub();
    if (this.bestUnsub) this.bestUnsub();
    console.log(`[Pipeline:${this.chainId}] Pipeline stopped.`);
  }

  /**
   * Backfill: fetch any blocks between our last indexed height
   * and the chain's current finalized head.
   */
  private async backfill(): Promise<void> {
    const dbHeight = await getLastFinalizedHeight();
    const chainTip = await this.getChainFinalizedHeight();

    if (chainTip <= dbHeight) {
      console.log(`[Pipeline:${this.chainId}] No backfill needed. DB at ${dbHeight}, chain at ${chainTip}`);
      return;
    }

    const gap = chainTip - dbHeight;
    console.log(`[Pipeline:${this.chainId}] Backfilling ${gap} blocks (${dbHeight + 1} -> ${chainTip})`);

    await upsertIndexerState(this.chainId, dbHeight, dbHeight, "syncing");

    const BATCH_SIZE = parseInt(process.env.BATCH_SIZE ?? "100", 10);

    for (let start = dbHeight + 1; start <= chainTip; start += BATCH_SIZE) {
      if (!this.running) break;

      const end = Math.min(start + BATCH_SIZE - 1, chainTip);
      const blockPromises: Promise<void>[] = [];

      for (let height = start; height <= end; height++) {
        blockPromises.push(this.fetchAndProcessByHash(null, height, "finalized"));
      }

      await Promise.all(blockPromises);

      await upsertIndexerState(this.chainId, end, end, "syncing");

      if ((end - dbHeight) % 1000 === 0 || end === chainTip) {
        console.log(`[Pipeline:${this.chainId}] Backfill progress: ${end}/${chainTip}`);
      }
    }

    await upsertIndexerState(this.chainId, chainTip, chainTip, "live");
    console.log(`[Pipeline:${this.chainId}] Backfill complete.`);
  }

  /** Subscribe to the finalized block stream */
  private subscribeFinalized(): void {
    const { client } = this.papiClient;

    const sub = client.finalizedBlock$.subscribe({
      next: async (block) => {
        try {
          console.log(`[Pipeline:${this.chainId}] Finalized block #${block.number}`);

          await this.fetchAndProcessByHash(block.hash, block.number, "finalized");
          await finalizeBlock(block.number);
          await upsertIndexerState(this.chainId, block.number, block.number, "live");
        } catch (err) {
          console.error(`[Pipeline:${this.chainId}] Error processing finalized block:`, err);
        }
      },
      error: (err) => {
        console.error(`[Pipeline:${this.chainId}] Finalized stream error:`, err);
      },
    });

    this.finalizedUnsub = () => sub.unsubscribe();
  }

  /** Subscribe to the best (unfinalized) block stream */
  private subscribeBestHead(): void {
    const { client } = this.papiClient;

    const sub = client.bestBlocks$.subscribe({
      next: async (blocks) => {
        try {
          // bestBlocks$ emits [best, ..., finalized]
          const latest = blocks[0];
          if (!latest) return;

          console.log(`[Pipeline:${this.chainId}] Best block #${latest.number}`);
          await this.fetchAndProcessByHash(latest.hash, latest.number, "best");
        } catch (err) {
          console.error(`[Pipeline:${this.chainId}] Error processing best block:`, err);
        }
      },
      error: (err) => {
        console.error(`[Pipeline:${this.chainId}] Best stream error:`, err);
      },
    });

    this.bestUnsub = () => sub.unsubscribe();
  }

  /**
   * Fetch a block by its hash (from subscription) and run it through the processor.
   * If hash is null (backfill by height), we look it up from the best/finalized blocks.
   */
  private async fetchAndProcessByHash(
    blockHash: string | null,
    height: number,
    status: BlockStatus
  ): Promise<void> {
    const rawBlock = await this.fetchBlock(blockHash, height);
    if (!rawBlock) {
      console.warn(`[Pipeline:${this.chainId}] Could not fetch block #${height}`);
      return;
    }

    await processBlock(rawBlock, status, this.registry);
  }

  /**
   * Fetch and extract a block using PAPI's PolkadotClient.
   *
   * PAPI's raw client returns:
   * - getBlockHeader(hash): { parentHash, number, stateRoot, extrinsicRoot, digests }
   * - getBlockBody(hash):   HexString[] (SCALE-encoded extrinsics)
   *
   * Full decoding of extrinsics and events requires a TypedApi with
   * chain-specific descriptors (generated via `npx papi add`). Without
   * descriptors, we store extrinsic count and raw hex data. Once descriptors
   * are added, the fetchBlock method can decode module/call/args fully.
   */
  private async fetchBlock(
    blockHash: string | null,
    height: number
  ): Promise<RawBlockData | null> {
    try {
      const { client } = this.papiClient;

      // Resolve hash: from subscription data, or look up
      let hash = blockHash;
      if (!hash) {
        hash = await this.resolveBlockHash(height);
        if (!hash) return null;
      }

      const [header, body] = await Promise.all([
        client.getBlockHeader(hash),
        client.getBlockBody(hash),
      ]);

      // Body is HexString[] — each element is a SCALE-encoded extrinsic.
      // Without chain descriptors we store them with minimal metadata.
      const extrinsics: RawBlockData["extrinsics"] = body.map(
        (encodedExt, i) => ({
          index: i,
          hash: `${hash}-${i}`,
          signer: null,
          module: "Unknown",
          call: "unknown",
          args: { raw: encodedExt },
          success: true,
          fee: null,
          tip: null,
        })
      );

      // Check digests for runtime upgrade flag
      const hasRuntimeUpgrade = header.digests.some(
        (d) => d.type === "runtimeUpdated"
      );
      if (hasRuntimeUpgrade) {
        console.log(
          `[Pipeline:${this.chainId}] Runtime upgrade detected at block #${height}`
        );
      }

      return {
        number: header.number,
        hash,
        parentHash: header.parentHash,
        stateRoot: header.stateRoot,
        extrinsicsRoot: header.extrinsicRoot,
        extrinsics,
        events: [], // Requires TypedApi with descriptors for decoding
        timestamp: null, // Requires decoding the Timestamp.set inherent
        validatorId: null,
        specVersion: 0,
      };
    } catch (err) {
      console.error(`[Pipeline:${this.chainId}] Failed to fetch block #${height}:`, err);
      return null;
    }
  }

  /**
   * Resolve a block hash from a block number.
   * Checks finalized and best blocks known to the PAPI client.
   */
  private async resolveBlockHash(height: number): Promise<string | null> {
    try {
      const { client } = this.papiClient;

      const finalized = await client.getFinalizedBlock();
      if (finalized.number === height) return finalized.hash;

      // Search the best blocks array for the requested height
      const bestBlocks = await client.getBestBlocks();
      const match = bestBlocks.find((b) => b.number === height);
      if (match) return match.hash;

      // For deeper historical blocks, PAPI descriptors or a direct
      // JSON-RPC chainHead call is needed. Log and skip for now.
      console.warn(
        `[Pipeline:${this.chainId}] Cannot resolve hash for block #${height}. ` +
          `Generate PAPI descriptors for full historical backfill.`
      );
      return null;
    } catch (err) {
      console.error(`[Pipeline:${this.chainId}] resolveBlockHash(${height}) failed:`, err);
      return null;
    }
  }

  private async getChainFinalizedHeight(): Promise<number> {
    try {
      const { client } = this.papiClient;
      const block = await client.getFinalizedBlock();
      return block.number;
    } catch {
      return 0;
    }
  }
}
