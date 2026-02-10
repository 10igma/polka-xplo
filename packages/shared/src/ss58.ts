/**
 * SS58 address encoding/decoding utilities.
 *
 * Uses @polkadot-api/substrate-bindings for the actual codec,
 * providing a simplified API for the explorer.
 *
 * All database storage uses hex public keys (0x-prefixed, 64 hex chars).
 * SS58 encoding is applied at the UI/API boundary based on a configurable prefix.
 */

import {
  AccountId,
  getSs58AddressInfo,
} from "@polkadot-api/substrate-bindings";
import { toHex, fromHex } from "@polkadot-api/utils";

/**
 * Decode an SS58 address into its raw public key hex (0x-prefixed).
 * Returns null if the input is invalid.
 */
export function ss58Decode(address: string): string | null {
  try {
    // Already a hex public key
    if (/^0x[0-9a-fA-F]{64}$/.test(address)) {
      return address.toLowerCase();
    }
    const info = getSs58AddressInfo(address);
    if (!info.isValid) return null;
    return toHex(info.publicKey).toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Get the SS58 prefix from an SS58-encoded address.
 * Returns null if the address is not valid SS58.
 */
export function ss58GetPrefix(address: string): number | null {
  try {
    if (/^0x[0-9a-fA-F]{64}$/.test(address)) return null;
    const info = getSs58AddressInfo(address);
    return info.isValid ? info.ss58Format : null;
  } catch {
    return null;
  }
}

/**
 * Encode a hex public key into an SS58 address with the given prefix.
 */
export function ss58Encode(hexPublicKey: string, prefix: number = 42): string {
  try {
    const codec = AccountId(prefix);
    return codec.dec(fromHex(hexPublicKey));
  } catch {
    return hexPublicKey; // fallback to raw hex
  }
}

/**
 * Check if a string is a valid SS58 or hex public key address.
 */
export function isValidAddress(input: string): boolean {
  if (/^0x[0-9a-fA-F]{64}$/.test(input)) return true;
  try {
    const info = getSs58AddressInfo(input);
    return info.isValid;
  } catch {
    return false;
  }
}

/**
 * Normalize any address input (SS58 of any prefix, or hex) to the
 * canonical hex public key used for DB lookups.
 */
export function normalizeAddress(input: string): string | null {
  return ss58Decode(input);
}
