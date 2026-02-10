import { describe, it, expect } from "vitest";
import { hexToBytes, bytesToHex } from "../hex-utils.js";

describe("hexToBytes", () => {
  it("converts a simple hex string without prefix", () => {
    const result = hexToBytes("deadbeef");
    expect(result).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  });

  it("converts a hex string with 0x prefix", () => {
    const result = hexToBytes("0xdeadbeef");
    expect(result).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  });

  it("returns empty Uint8Array for empty string", () => {
    expect(hexToBytes("")).toEqual(new Uint8Array(0));
  });

  it("returns empty Uint8Array for bare 0x prefix", () => {
    expect(hexToBytes("0x")).toEqual(new Uint8Array(0));
  });

  it("handles a single byte", () => {
    expect(hexToBytes("ff")).toEqual(new Uint8Array([0xff]));
  });

  it("handles all-zero bytes", () => {
    expect(hexToBytes("0x000000")).toEqual(new Uint8Array([0, 0, 0]));
  });

  it("handles uppercase hex", () => {
    expect(hexToBytes("0xABCD")).toEqual(new Uint8Array([0xab, 0xcd]));
  });

  it("handles a full 32-byte hash", () => {
    const hash =
      "0x0000000000000000000000000000000000000000000000000000000000000001";
    const result = hexToBytes(hash);
    expect(result.length).toBe(32);
    expect(result[31]).toBe(1);
    expect(result[0]).toBe(0);
  });
});

describe("bytesToHex", () => {
  it("converts bytes to lowercase hex without prefix", () => {
    const result = bytesToHex(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
    expect(result).toBe("deadbeef");
  });

  it("pads single-digit hex values with leading zero", () => {
    const result = bytesToHex(new Uint8Array([0x0a, 0x01]));
    expect(result).toBe("0a01");
  });

  it("returns empty string for empty array", () => {
    expect(bytesToHex(new Uint8Array(0))).toBe("");
  });

  it("handles all-zero bytes", () => {
    expect(bytesToHex(new Uint8Array([0, 0, 0]))).toBe("000000");
  });
});

describe("hexToBytes ↔ bytesToHex round-trip", () => {
  it("round-trips correctly", () => {
    const original = "deadbeef01020304";
    const bytes = hexToBytes(original);
    const result = bytesToHex(bytes);
    expect(result).toBe(original);
  });

  it("round-trips a 32-byte hash", () => {
    const original =
      "a1b2c3d4e5f60718293a4b5c6d7e8f900102030405060708091a1b1c1d1e1f20";
    expect(bytesToHex(hexToBytes(original))).toBe(original);
  });
});
