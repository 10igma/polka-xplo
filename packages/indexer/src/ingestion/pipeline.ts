import type { PapiClient } from "../client.js";
import type { PluginRegistry } from "../plugins/registry.js";
import { processBlock, type RawBlockData } from "./block-processor.js";
import {
  getLastFinalizedHeight,
  upsertIndexerState,
  finalizeBlock,
  pruneForkedBlocks,
} from "@polka-xplo/db";
import type { BlockStatus } from "@polka-xplo/shared";

/**
 * The Ingestion Pipeline manages the dual-stream architecture:
 * 1. The Canonical (Finalized) Stream — source of truth
 * 2. The Live (Best Head) Stream — optimistic updates
 *
 * It also handles backfilling gaps when the indexer restarts.
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
        blockPromises.push(this.fetchAndProcess(height, "finalized"));
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

    // Use PAPI's finalized block observable
    const sub = client.finalizedBlock$.subscribe({
      next: async (block) => {
        try {
          const height = block.number;
          console.log(`[Pipeline:${this.chainId}] Finalized block #${height}`);

          await this.fetchAndProcess(height, "finalized");
          await finalizeBlock(height);
          await upsertIndexerState(this.chainId, height, height, "live");
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
          // bestBlocks$ emits an array of blocks in the best chain
          // We process only the latest
          const latest = blocks[blocks.length - 1];
          if (!latest) return;

          const height = latest.number;
          console.log(`[Pipeline:${this.chainId}] Best block #${height}`);

          await this.fetchAndProcess(height, "best");
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

  /** Fetch a block from the node and run it through the processor */
  private async fetchAndProcess(
    height: number,
    status: BlockStatus
  ): Promise<void> {
    const rawBlock = await this.fetchBlock(height);
    if (!rawBlock) {
      console.warn(`[Pipeline:${this.chainId}] Could not fetch block #${height}`);
      return;
    }

    // Detect runtime upgrades
    if (rawBlock.specVersion !== (await this.getLastSpecVersion())) {
      console.log(
        `[Pipeline:${this.chainId}] Runtime upgrade detected at block #${height} (spec ${rawBlock.specVersion})`
      );
      // In production: pause, re-fetch metadata, rebuild descriptors
      // For now: log and continue with updated specVersion tracking
    }

    await processBlock(rawBlock, status, this.registry);
  }

  /**
   * Fetch and decode a block using PAPI.
   * This extracts headers, extrinsics, and events into our normalized format.
   */
  private async fetchBlock(height: number): Promise<RawBlockData | null> {
    try {
      const { client } = this.papiClient;
      const blockHash = await client.getBlockHash(height);
      const body = await client.getBlockBody(blockHash);
      const header = await client.getBlockHeader(blockHash);

      // Decode extrinsics using PAPI's runtime metadata
      const extrinsics: RawBlockData["extrinsics"] = [];
      const events: RawBlockData["events"] = [];

      // Process body extrinsics
      if (body) {
        for (let i = 0; i < body.length; i++) {
          const ext = body[i];
          extrinsics.push({
            index: i,
            hash: ext.hash ?? `${blockHash}-${i}`,
            signer: ext.address?.toString() ?? null,
            module: ext.callData?.type ?? "Unknown",
            call: ext.callData?.value?.type ?? "unknown",
            args: ext.callData?.value?.value
              ? this.safeSerialize(ext.callData.value.value)
              : {},
            success: true, // Updated by event correlation
            fee: null,
            tip: null,
          });
        }
      }

      // Fetch events for this block
      const blockEvents = await client.getEvents(blockHash);
      if (blockEvents) {
        for (let i = 0; i < blockEvents.length; i++) {
          const evt = blockEvents[i];
          const phase = evt.phase;

          let phaseType: "ApplyExtrinsic" | "Finalization" | "Initialization" =
            "Initialization";
          let extrinsicIndex: number | null = null;

          if (phase.type === "ApplyExtrinsic") {
            phaseType = "ApplyExtrinsic";
            extrinsicIndex = phase.value;

            // Mark extrinsic as failed if we see ExtrinsicFailed
            if (evt.event?.type === "System" && evt.event?.value?.type === "ExtrinsicFailed") {
              const ext = extrinsics[extrinsicIndex];
              if (ext) ext.success = false;
            }
          } else if (phase.type === "Finalization") {
            phaseType = "Finalization";
          }

          events.push({
            index: i,
            extrinsicIndex,
            module: evt.event?.type ?? "Unknown",
            event: evt.event?.value?.type ?? "unknown",
            data: evt.event?.value?.value
              ? this.safeSerialize(evt.event.value.value)
              : {},
            phaseType,
          });
        }
      }

      // Extract timestamp from Timestamp.set extrinsic
      let timestamp: number | null = null;
      const timestampExt = extrinsics.find(
        (e) => e.module === "Timestamp" && e.call === "set"
      );
      if (timestampExt?.args?.now) {
        timestamp = Number(timestampExt.args.now);
      }

      return {
        number: height,
        hash: blockHash,
        parentHash: header.parentHash,
        stateRoot: header.stateRoot,
        extrinsicsRoot: header.extrinsicsRoot,
        extrinsics,
        events,
        timestamp,
        validatorId: null, // Extracted from consensus digest
        specVersion: header.specVersion ?? 0,
      };
    } catch (err) {
      console.error(`[Pipeline:${this.chainId}] Failed to fetch block #${height}:`, err);
      return null;
    }
  }

  /** Safely serialize complex PAPI objects to plain JSON */
  private safeSerialize(obj: unknown): Record<string, unknown> {
    try {
      return JSON.parse(
        JSON.stringify(obj, (_key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );
    } catch {
      return {};
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

  private async getLastSpecVersion(): Promise<number> {
    // In production, track this in the indexer state
    return 0;
  }
}
