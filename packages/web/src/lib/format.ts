/**
 * Formatting utilities for the explorer UI.
 */

/** Truncate a hex hash for display */
export function truncateHash(hash: string, chars = 6): string {
  if (!hash || hash.length <= chars * 2 + 2) return hash ?? "";
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

/** Format a balance from raw planck value */
export function formatBalance(
  raw: string | null,
  decimals = 10,
  symbol = "DOT"
): string {
  if (!raw || raw === "0") return `0 ${symbol}`;
  try {
    const value = BigInt(raw);
    const divisor = BigInt(10 ** decimals);
    const whole = value / divisor;
    const remainder = value % divisor;
    const decimal = remainder
      .toString()
      .padStart(decimals, "0")
      .slice(0, 4)
      .replace(/0+$/, "");
    return `${whole}${decimal ? "." + decimal : ""} ${symbol}`;
  } catch {
    return `${raw} planck`;
  }
}

/** Format a Unix timestamp (ms or seconds) into a relative time string */
export function timeAgo(timestamp: number | null): string {
  if (!timestamp) return "—";
  // Normalize to seconds
  const ts = timestamp > 1e12 ? Math.floor(timestamp / 1000) : timestamp;
  const seconds = Math.floor(Date.now() / 1000 - ts);

  if (seconds < 0) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Format a block number with comma separators */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/** Format a date from a Unix timestamp */
export function formatDate(timestamp: number | null): string {
  if (!timestamp) return "—";
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
