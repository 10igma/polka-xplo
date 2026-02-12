/**
 * Chain State Queries — fetch live on-chain state via RPC.
 *
 * Uses `state_getStorage` with manually constructed storage keys
 * and lightweight SCALE decoding. This is the standard block-explorer
 * approach: always query the live chain for current account balances
 * rather than trying to reconstruct them from indexed events.
 */

import { blake2b } from "@noble/hashes/blake2.js";
import type { RpcPool } from "./rpc-pool.js";
import { hexToBytes, bytesToHex } from "./hex-utils.js";

// Pre-computed storage key prefix for System.Account:
//   twox128("System") + twox128("Account")
const SYSTEM_ACCOUNT_PREFIX =
  "26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9";

/**
 * Compute the full storage key for System.Account(accountId).
 *
 * Key hasher: Blake2_128Concat
 *   = blake2b_128(accountId) ++ accountId
 */
function systemAccountKey(accountIdHex: string): string {
  // accountIdHex is the 32-byte public key (hex, with or without 0x)
  const clean = accountIdHex.startsWith("0x") ? accountIdHex.slice(2) : accountIdHex;
  const accountBytes = hexToBytes(clean);

  // blake2b with 16-byte (128-bit) digest
  const hash = blake2b(accountBytes, { dkLen: 16 });

  // Blake2_128Concat = hash ++ raw_key
  return "0x" + SYSTEM_ACCOUNT_PREFIX + bytesToHex(hash) + clean;
}

/**
 * Read a little-endian u128 from a Uint8Array at the given offset.
 * Returns a bigint string (decimal) for JSON serialization.
 */
function readU128(bytes: Uint8Array, offset: number): string {
  let value = 0n;
  for (let i = 0; i < 16; i++) {
    value |= BigInt(bytes[offset + i]) << BigInt(i * 8);
  }
  return value.toString();
}

/**
 * Read a little-endian u32 from a Uint8Array at the given offset.
 */
function readU32(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

export interface LiveAccountInfo {
  nonce: number;
  consumers: number;
  providers: number;
  sufficients: number;
  free: string;
  reserved: string;
  frozen: string;
  flags: string;
}

/**
 * Fetch the live account balance from the chain via `state_getStorage`.
 *
 * SCALE layout of AccountInfo<Index, AccountData>:
 *   nonce:       u32  (4 bytes)
 *   consumers:   u32  (4 bytes)
 *   providers:   u32  (4 bytes)
 *   sufficients: u32  (4 bytes)
 *   data.free:     u128 (16 bytes)
 *   data.reserved: u128 (16 bytes)
 *   data.frozen:   u128 (16 bytes)
 *   data.flags:    u128 (16 bytes)
 *   Total: 80 bytes
 */
export async function getLiveBalance(
  rpcPool: RpcPool,
  accountIdHex: string,
): Promise<LiveAccountInfo | null> {
  const storageKey = systemAccountKey(accountIdHex);

  const storageHex = await rpcPool.call<string | null>("state_getStorage", [storageKey]);
  if (!storageHex) return null;

  const bytes = hexToBytes(storageHex);
  if (bytes.length < 80) return null;

  return {
    nonce: readU32(bytes, 0),
    consumers: readU32(bytes, 4),
    providers: readU32(bytes, 8),
    sufficients: readU32(bytes, 12),
    free: readU128(bytes, 16),
    reserved: readU128(bytes, 32),
    frozen: readU128(bytes, 48),
    flags: readU128(bytes, 64),
  };
}
