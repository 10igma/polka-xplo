import { describe, it, expect } from "vitest";
import {
  ss58Decode,
  ss58Encode,
  ss58GetPrefix,
  isValidAddress,
  normalizeAddress,
} from "../ss58.js";

// A well-known Polkadot address and its raw hex public key (Alice)
const ALICE_HEX =
  "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d";

// ---------------------------------------------------------------------------
// ss58Decode
// ---------------------------------------------------------------------------

describe("ss58Decode", () => {
  it("returns lowercase hex for an already-hex public key", () => {
    expect(ss58Decode(ALICE_HEX)).toBe(ALICE_HEX);
  });

  it("lowercases hex input", () => {
    const upper = ALICE_HEX.toUpperCase().replace("0X", "0x");
    expect(ss58Decode(upper)).toBe(ALICE_HEX);
  });

  it("returns null for invalid input", () => {
    expect(ss58Decode("not-an-address")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(ss58Decode("")).toBeNull();
  });

  it("returns null for a hex string that is not 64 chars", () => {
    expect(ss58Decode("0x1234")).toBeNull();
  });

  it("decodes a valid SS58 address back to hex public key", () => {
    // Encode Alice as SS58 prefix 42 (generic Substrate) then decode back
    const ss58 = ss58Encode(ALICE_HEX, 42);
    expect(ss58).not.toBe(ALICE_HEX); // should be SS58 format
    const decoded = ss58Decode(ss58);
    expect(decoded).toBe(ALICE_HEX);
  });
});

// ---------------------------------------------------------------------------
// ss58Encode
// ---------------------------------------------------------------------------

describe("ss58Encode", () => {
  it("encodes to an SS58 address string (default prefix 42)", () => {
    const result = ss58Encode(ALICE_HEX);
    expect(typeof result).toBe("string");
    expect(result).not.toContain("0x");
    expect(result.length).toBeGreaterThan(10);
  });

  it("encodes with a specific prefix", () => {
    const generic = ss58Encode(ALICE_HEX, 42);
    const polkadot = ss58Encode(ALICE_HEX, 0);
    // Different prefixes produce different addresses
    expect(generic).not.toBe(polkadot);
  });

  it("does not throw for non-hex input (codec handles gracefully)", () => {
    // fromHex may interpret arbitrary strings; verify no throw
    expect(() => ss58Encode("bad-input")).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// ss58GetPrefix
// ---------------------------------------------------------------------------

describe("ss58GetPrefix", () => {
  it("returns null for hex public key (not SS58)", () => {
    expect(ss58GetPrefix(ALICE_HEX)).toBeNull();
  });

  it("returns the prefix for a valid SS58 address", () => {
    const encoded = ss58Encode(ALICE_HEX, 42);
    expect(ss58GetPrefix(encoded)).toBe(42);
  });

  it("returns null for invalid address", () => {
    expect(ss58GetPrefix("invalid")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isValidAddress
// ---------------------------------------------------------------------------

describe("isValidAddress", () => {
  it("returns true for valid hex public key", () => {
    expect(isValidAddress(ALICE_HEX)).toBe(true);
  });

  it("returns true for valid SS58 address", () => {
    const ss58 = ss58Encode(ALICE_HEX, 42);
    expect(isValidAddress(ss58)).toBe(true);
  });

  it("returns false for invalid string", () => {
    expect(isValidAddress("not-valid")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidAddress("")).toBe(false);
  });

  it("returns false for truncated hex", () => {
    expect(isValidAddress("0x1234")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// normalizeAddress
// ---------------------------------------------------------------------------

describe("normalizeAddress", () => {
  it("normalizes hex to lowercase hex", () => {
    expect(normalizeAddress(ALICE_HEX)).toBe(ALICE_HEX);
  });

  it("normalizes SS58 to hex", () => {
    const ss58 = ss58Encode(ALICE_HEX, 0);
    expect(normalizeAddress(ss58)).toBe(ALICE_HEX);
  });

  it("returns null for invalid input", () => {
    expect(normalizeAddress("garbage")).toBeNull();
  });
});
