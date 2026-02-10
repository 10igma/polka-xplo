import type {
  Block,
  Extrinsic,
  ExplorerEvent,
  BlockContext,
  BlockStatus,
} from "@polka-xplo/shared";
import {
  insertBlock,
  insertExtrinsic,
  insertEvent,
  upsertAccount,
  transaction,
} from "@polka-xplo/db";
import type { PluginRegistry } from "../plugins/registry.js";

export interface RawBlockData {
  number: number;
  hash: string;
  parentHash: string;
  stateRoot: string;
  extrinsicsRoot: string;
  extrinsics: RawExtrinsic[];
  events: RawEvent[];
  digestLogs: { type: string; engine: string | null; data: string }[];
  timestamp: number | null;
  validatorId: string | null;
  specVersion: number;
}

export interface RawExtrinsic {
  index: number;
  hash: string | null;
  signer: string | null;
  module: string;
  call: string;
  args: Record<string, unknown>;
  success: boolean;
  fee: string | null;
  tip: string | null;
}

export interface RawEvent {
  index: number;
  extrinsicIndex: number | null;
  module: string;
  event: string;
  data: Record<string, unknown>;
  phaseType: "ApplyExtrinsic" | "Finalization" | "Initialization";
}

/**
 * Process a single block: store block, extrinsics, events,
 * update accounts, and invoke extension plugins.
 */
export async function processBlock(
  raw: RawBlockData,
  status: BlockStatus,
  registry: PluginRegistry
): Promise<void> {
  const blockCtx: BlockContext = {
    blockHeight: raw.number,
    blockHash: raw.hash,
    timestamp: raw.timestamp,
    specVersion: raw.specVersion,
  };

  // Wrap all DB writes in a single transaction to prevent partial data on failure
  await transaction(async (client) => {
    // 1. Build and store the block record
    const block: Block = {
      height: raw.number,
      hash: raw.hash,
      parentHash: raw.parentHash,
      stateRoot: raw.stateRoot,
      extrinsicsRoot: raw.extrinsicsRoot,
      timestamp: raw.timestamp,
      validatorId: raw.validatorId,
      status,
      specVersion: raw.specVersion,
      eventCount: raw.events.length,
      extrinsicCount: raw.extrinsics.length,
      digestLogs: raw.digestLogs,
    };

    await insertBlock(block, client);

    // Invoke onBlock hooks
    await registry.invokeBlockHandlers(blockCtx, block);

    // 2. Process extrinsics
    const extrinsicMap = new Map<number, string>(); // index -> id

    for (const rawExt of raw.extrinsics) {
      const extId = `${raw.number}-${rawExt.index}`;
      extrinsicMap.set(rawExt.index, extId);

      const extrinsic: Extrinsic = {
        id: extId,
        blockHeight: raw.number,
        txHash: rawExt.hash,
        index: rawExt.index,
        signer: rawExt.signer,
        module: rawExt.module,
        call: rawExt.call,
        args: rawExt.args,
        success: rawExt.success,
        fee: rawExt.fee,
        tip: rawExt.tip,
      };

      await insertExtrinsic(extrinsic, client);

      // Track signer account
      if (rawExt.signer) {
        await upsertAccount(rawExt.signer, rawExt.signer, raw.number, client);
      }

      // Invoke extension extrinsic handlers
      await registry.invokeExtrinsicHandlers(blockCtx, extrinsic);
    }

    // 3. Process events and correlate with extrinsics
    for (const rawEvt of raw.events) {
      const evtId = `${raw.number}-${rawEvt.index}`;
      const extrinsicId =
        rawEvt.extrinsicIndex !== null
          ? extrinsicMap.get(rawEvt.extrinsicIndex) ?? null
          : null;

      const event: ExplorerEvent = {
        id: evtId,
        blockHeight: raw.number,
        extrinsicId,
        index: rawEvt.index,
        module: rawEvt.module,
        event: rawEvt.event,
        data: rawEvt.data,
        phase:
          rawEvt.phaseType === "ApplyExtrinsic"
            ? { type: "ApplyExtrinsic", index: rawEvt.extrinsicIndex! }
            : rawEvt.phaseType === "Finalization"
              ? { type: "Finalization" }
              : { type: "Initialization" },
      };

      await insertEvent(event, client);

      // Track accounts referenced in events
      const addrs = extractAccountsFromEvent(rawEvt);
      for (const addr of addrs) {
        await upsertAccount(addr, addr, raw.number, client);
      }

      // Invoke extension event handlers
      await registry.invokeEventHandlers(blockCtx, event);
    }
  });
}

// ============================================================
// Event-based account extraction
// ============================================================

/**
 * Extract account addresses mentioned in well-known Substrate events.
 * This ensures accounts appear in the explorer even if they never signed
 * a transaction (e.g. transfer recipients, endowed accounts, treasury).
 */
function extractAccountsFromEvent(evt: RawEvent): string[] {
  const addrs: string[] = [];
  const d = evt.data;
  if (!d || typeof d !== "object") return addrs;

  switch (`${evt.module}.${evt.event}`) {
    // Balances pallet
    case "Balances.Transfer":
      if (d.from) addrs.push(String(d.from));
      if (d.to) addrs.push(String(d.to));
      break;
    case "Balances.Endowed":
    case "Balances.DustLost":
    case "Balances.BalanceSet":
    case "Balances.Reserved":
    case "Balances.Unreserved":
    case "Balances.Slashed":
    case "Balances.Frozen":
    case "Balances.Thawed":
      if (d.who) addrs.push(String(d.who));
      if (d.account) addrs.push(String(d.account));
      break;
    case "Balances.Deposit":
    case "Balances.Withdraw":
      if (d.who) addrs.push(String(d.who));
      break;
    // System pallet
    case "System.NewAccount":
    case "System.KilledAccount":
      if (d.account) addrs.push(String(d.account));
      break;
    // Staking / Session
    case "Staking.Rewarded":
      if (d.stash) addrs.push(String(d.stash));
      break;
    case "Staking.Slashed":
      if (d.staker) addrs.push(String(d.staker));
      break;
  }

  // Filter out obviously invalid values (non-hex, too short)
  return addrs.filter((a) => a.startsWith("0x") && a.length >= 42);
}
