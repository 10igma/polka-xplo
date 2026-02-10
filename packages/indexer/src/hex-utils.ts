/**
 * Hex encoding/decoding utilities.
 *
 * Extracted from pipeline.ts / extrinsic-decoder.ts / runtime-parser.ts
 * into a single module so it can be shared and tested easily.
 */

/** Convert a hex string (with or without 0x prefix) to a Uint8Array. */
export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!clean) return new Uint8Array(0);
  return new Uint8Array(clean.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
}

/** Convert a Uint8Array to a hex string (lowercase, no prefix). */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
