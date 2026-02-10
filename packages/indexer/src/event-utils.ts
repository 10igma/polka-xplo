/**
 * Pure functions for event/extrinsic correlation.
 *
 * These functions were extracted from pipeline.ts and block-processor.ts
 * so they can be tested in isolation without pulling in heavy dependencies
 * (DB clients, RPC pools, SCALE codecs, etc.).
 *
 * Uses `import type` only — no runtime dependency on other modules.
 */

import type { RawExtrinsic, RawEvent } from "./ingestion/block-processor.js";

// Re-export the types so tests can use them
export type { RawExtrinsic, RawEvent };

/**
 * Post-process extrinsics with decoded events to fill in success/fee.
 * Correlates System.ExtrinsicSuccess / ExtrinsicFailed events and
 * TransactionPayment.TransactionFeePaid events.
 *
 * Fee derivation priority:
 * 1. TransactionPayment.TransactionFeePaid → actual_fee  (most chains)
 * 2. Balances.Withdraw on a signed extrinsic → amount     (Ajuna / older runtimes)
 */
export function enrichExtrinsicsFromEvents(extrinsics: RawExtrinsic[], events: RawEvent[]): void {
  for (const evt of events) {
    if (evt.extrinsicIndex == null) continue;
    const ext = extrinsics[evt.extrinsicIndex];
    if (!ext) continue;

    if (evt.module === "System" && evt.event === "ExtrinsicFailed") {
      ext.success = false;
    }
    // Prefer TransactionFeePaid (explicit fee event)
    if (evt.module === "TransactionPayment" && evt.event === "TransactionFeePaid") {
      const fee = evt.data?.actual_fee ?? evt.data?.actualFee;
      if (fee != null) ext.fee = String(fee);
    }
    // Fallback: Balances.Withdraw on a signed extrinsic is the fee deduction
    if (evt.module === "Balances" && evt.event === "Withdraw" && ext.signer && ext.fee == null) {
      const amount = evt.data?.amount;
      if (amount != null) ext.fee = String(amount);
    }
  }
}

/**
 * Extract account addresses mentioned in well-known Substrate events.
 * Ensures accounts appear in the explorer even if they never signed
 * a transaction (e.g. transfer recipients, endowed accounts).
 */
export function extractAccountsFromEvent(evt: RawEvent): string[] {
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
