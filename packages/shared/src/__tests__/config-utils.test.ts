import { describe, it, expect } from "vitest";
import { truncateHash, timeAgo } from "../config.js";

// ---------------------------------------------------------------------------
// truncateHash
// ---------------------------------------------------------------------------

describe("truncateHash", () => {
  it("truncates a long hash with default chars=6", () => {
    const hash = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    const result = truncateHash(hash);
    // chars=6 → first 8 chars + "..." + last 6
    expect(result).toBe("0xabcdef...567890");
  });

  it("truncates with custom chars count", () => {
    const hash = "0xabcdef1234567890";
    const result = truncateHash(hash, 4);
    // chars=4 → first 6 chars ("0xabcd") + "..." + last 4 ("7890")
    expect(result).toBe("0xabcd...7890");
  });

  it("returns the full hash if shorter than or equal to threshold", () => {
    expect(truncateHash("0xabcd")).toBe("0xabcd");
  });

  it("returns empty string for null/undefined", () => {
    expect(truncateHash(null as any)).toBe("");
    expect(truncateHash(undefined as any)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(truncateHash("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// timeAgo
// ---------------------------------------------------------------------------

describe("timeAgo", () => {
  it('returns "—" for null', () => {
    expect(timeAgo(null)).toBe("\u2014");
  });

  it('returns "—" for 0', () => {
    expect(timeAgo(0)).toBe("\u2014");
  });

  it("returns seconds ago", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(timeAgo(now - 30)).toBe("30s ago");
  });

  it("returns minutes ago", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(timeAgo(now - 120)).toBe("2m ago");
  });

  it("returns hours ago", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(timeAgo(now - 7200)).toBe("2h ago");
  });

  it("returns days ago", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(timeAgo(now - 172800)).toBe("2d ago");
  });

  it('returns "just now" for future timestamps', () => {
    const future = Math.floor(Date.now() / 1000) + 600;
    expect(timeAgo(future)).toBe("just now");
  });

  it("handles millisecond timestamps by normalizing to seconds", () => {
    const nowMs = Date.now();
    const result = timeAgo(nowMs - 30_000);
    expect(result).toBe("30s ago");
  });
});
