/**
 * Formatting utilities for the explorer UI.
 * truncateHash and timeAgo are re-exported from @polka-xplo/shared
 * to keep a single source of truth.
 */

export { truncateHash, timeAgo } from "@polka-xplo/shared";

/** Format a balance from raw planck value */
export function formatBalance(raw: string | null, decimals = 10, symbol = "DOT"): string {
  if (!raw || raw === "0") return `0 ${symbol}`;
  try {
    const value = BigInt(raw);
    const divisor = BigInt(10 ** decimals);
    const whole = value / divisor;
    const remainder = value % divisor;
    const decimal = remainder.toString().padStart(decimals, "0").slice(0, 4).replace(/0+$/, "");
    return `${whole}${decimal ? "." + decimal : ""} ${symbol}`;
  } catch {
    return `${raw} planck`;
  }
}

/** Format a block number with comma separators */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/** Format a date from a Unix timestamp */
export function formatDate(timestamp: number | null): string {
  if (!timestamp) return "\u2014";
  const ts = timestamp > 1e12 ? timestamp : timestamp * 1000;
  return new Date(ts).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
