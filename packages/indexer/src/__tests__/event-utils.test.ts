import { describe, it, expect } from "vitest";
import {
  enrichExtrinsicsFromEvents,
  extractAccountsFromEvent,
  type RawExtrinsic,
  type RawEvent,
} from "../event-utils.js";

// ---------------------------------------------------------------------------
// Helpers to create minimal test fixtures
// ---------------------------------------------------------------------------

function makeExtrinsic(overrides: Partial<RawExtrinsic> = {}): RawExtrinsic {
  return {
    index: 0,
    hash: null,
    signer: null,
    module: "System",
    call: "remark",
    args: {},
    success: true,
    fee: null,
    tip: null,
    ...overrides,
  };
}

function makeEvent(overrides: Partial<RawEvent> = {}): RawEvent {
  return {
    index: 0,
    extrinsicIndex: null,
    module: "System",
    event: "ExtrinsicSuccess",
    data: {},
    phaseType: "ApplyExtrinsic",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// enrichExtrinsicsFromEvents
// ---------------------------------------------------------------------------

describe("enrichExtrinsicsFromEvents", () => {
  it("marks extrinsic as failed on ExtrinsicFailed event", () => {
    const ext = makeExtrinsic({ index: 0, success: true });
    const evt = makeEvent({
      extrinsicIndex: 0,
      module: "System",
      event: "ExtrinsicFailed",
    });

    enrichExtrinsicsFromEvents([ext], [evt]);
    expect(ext.success).toBe(false);
  });

  it("sets fee from TransactionFeePaid (actual_fee)", () => {
    const ext = makeExtrinsic({ index: 0, signer: "0xabc" });
    const evt = makeEvent({
      extrinsicIndex: 0,
      module: "TransactionPayment",
      event: "TransactionFeePaid",
      data: { actual_fee: 12345 },
    });

    enrichExtrinsicsFromEvents([ext], [evt]);
    expect(ext.fee).toBe("12345");
  });

  it("sets fee from TransactionFeePaid (actualFee variant)", () => {
    const ext = makeExtrinsic({ index: 0, signer: "0xabc" });
    const evt = makeEvent({
      extrinsicIndex: 0,
      module: "TransactionPayment",
      event: "TransactionFeePaid",
      data: { actualFee: 99999n },
    });

    enrichExtrinsicsFromEvents([ext], [evt]);
    expect(ext.fee).toBe("99999");
  });

  it("falls back to Balances.Withdraw for fee on signed extrinsics", () => {
    const ext = makeExtrinsic({ index: 0, signer: "0xabc" });
    const evt = makeEvent({
      extrinsicIndex: 0,
      module: "Balances",
      event: "Withdraw",
      data: { amount: 5000 },
    });

    enrichExtrinsicsFromEvents([ext], [evt]);
    expect(ext.fee).toBe("5000");
  });

  it("does NOT use Balances.Withdraw fallback for unsigned extrinsics", () => {
    const ext = makeExtrinsic({ index: 0, signer: null });
    const evt = makeEvent({
      extrinsicIndex: 0,
      module: "Balances",
      event: "Withdraw",
      data: { amount: 5000 },
    });

    enrichExtrinsicsFromEvents([ext], [evt]);
    expect(ext.fee).toBeNull();
  });

  it("does NOT override TransactionFeePaid with Balances.Withdraw fallback", () => {
    const ext = makeExtrinsic({ index: 0, signer: "0xabc" });
    const events = [
      makeEvent({
        index: 0,
        extrinsicIndex: 0,
        module: "TransactionPayment",
        event: "TransactionFeePaid",
        data: { actual_fee: 100 },
      }),
      makeEvent({
        index: 1,
        extrinsicIndex: 0,
        module: "Balances",
        event: "Withdraw",
        data: { amount: 200 },
      }),
    ];

    enrichExtrinsicsFromEvents([ext], events);
    expect(ext.fee).toBe("100");
  });

  it("skips events with no extrinsicIndex", () => {
    const ext = makeExtrinsic({ index: 0 });
    const evt = makeEvent({
      extrinsicIndex: null,
      module: "System",
      event: "ExtrinsicFailed",
    });

    enrichExtrinsicsFromEvents([ext], [evt]);
    expect(ext.success).toBe(true);
  });

  it("skips events targeting non-existent extrinsic index", () => {
    const ext = makeExtrinsic({ index: 0 });
    const evt = makeEvent({
      extrinsicIndex: 99,
      module: "System",
      event: "ExtrinsicFailed",
    });

    enrichExtrinsicsFromEvents([ext], [evt]);
    expect(ext.success).toBe(true);
  });

  it("handles empty arrays", () => {
    enrichExtrinsicsFromEvents([], []);
    // no error thrown
  });
});

// ---------------------------------------------------------------------------
// extractAccountsFromEvent
// ---------------------------------------------------------------------------

const VALID_HEX =
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

describe("extractAccountsFromEvent", () => {
  it("extracts from and to from Balances.Transfer", () => {
    const result = extractAccountsFromEvent(
      makeEvent({
        module: "Balances",
        event: "Transfer",
        data: { from: VALID_HEX, to: VALID_HEX.replace(/1/g, "a") },
      })
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(VALID_HEX);
  });

  it("extracts who from Balances.Deposit", () => {
    const result = extractAccountsFromEvent(
      makeEvent({
        module: "Balances",
        event: "Deposit",
        data: { who: VALID_HEX },
      })
    );
    expect(result).toEqual([VALID_HEX]);
  });

  it("extracts who from Balances.Withdraw", () => {
    const result = extractAccountsFromEvent(
      makeEvent({
        module: "Balances",
        event: "Withdraw",
        data: { who: VALID_HEX },
      })
    );
    expect(result).toEqual([VALID_HEX]);
  });

  it("extracts who and account from Balances.Endowed", () => {
    const result = extractAccountsFromEvent(
      makeEvent({
        module: "Balances",
        event: "Endowed",
        data: { who: VALID_HEX, account: VALID_HEX },
      })
    );
    expect(result).toHaveLength(2);
  });

  it("extracts account from System.NewAccount", () => {
    const result = extractAccountsFromEvent(
      makeEvent({
        module: "System",
        event: "NewAccount",
        data: { account: VALID_HEX },
      })
    );
    expect(result).toEqual([VALID_HEX]);
  });

  it("extracts account from System.KilledAccount", () => {
    const result = extractAccountsFromEvent(
      makeEvent({
        module: "System",
        event: "KilledAccount",
        data: { account: VALID_HEX },
      })
    );
    expect(result).toEqual([VALID_HEX]);
  });

  it("extracts stash from Staking.Rewarded", () => {
    const result = extractAccountsFromEvent(
      makeEvent({
        module: "Staking",
        event: "Rewarded",
        data: { stash: VALID_HEX },
      })
    );
    expect(result).toEqual([VALID_HEX]);
  });

  it("extracts staker from Staking.Slashed", () => {
    const result = extractAccountsFromEvent(
      makeEvent({
        module: "Staking",
        event: "Slashed",
        data: { staker: VALID_HEX },
      })
    );
    expect(result).toEqual([VALID_HEX]);
  });

  it("filters out non-hex addresses", () => {
    const result = extractAccountsFromEvent(
      makeEvent({
        module: "Balances",
        event: "Transfer",
        data: { from: "not-hex", to: VALID_HEX },
      })
    );
    expect(result).toEqual([VALID_HEX]);
  });

  it("filters out too-short hex addresses", () => {
    const result = extractAccountsFromEvent(
      makeEvent({
        module: "Balances",
        event: "Transfer",
        data: { from: "0x1234", to: VALID_HEX },
      })
    );
    expect(result).toEqual([VALID_HEX]);
  });

  it("returns empty for unknown events", () => {
    const result = extractAccountsFromEvent(
      makeEvent({
        module: "Contracts",
        event: "Instantiated",
        data: { deployer: VALID_HEX },
      })
    );
    expect(result).toEqual([]);
  });

  it("returns empty when data is null", () => {
    const result = extractAccountsFromEvent(
      makeEvent({ module: "Balances", event: "Transfer", data: null as any })
    );
    expect(result).toEqual([]);
  });
});
