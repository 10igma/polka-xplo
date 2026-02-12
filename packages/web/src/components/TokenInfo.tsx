"use client";

import React from "react";

/**
 * Displays the native token symbol (and optionally price data)
 * on the right side of the header's second row.
 *
 * For now shows symbol only — price feed can be wired in later
 * via CoinGecko / SubQuery / another provider.
 */
export function TokenInfo({ symbol }: { symbol: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-400 shrink-0">
      {/* Token badge */}
      <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700/50 bg-zinc-800/60 px-2.5 py-1 text-xs font-medium text-zinc-200">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: "var(--color-accent)" }}
        />
        {symbol}
      </span>
    </div>
  );
}
