import React from "react";
import { formatBalance } from "@/lib/format";

interface Balance {
  free: string;
  reserved: string;
  frozen: string;
}

/**
 * Balance breakdown display.
 * Shows transferable, locked/frozen, and reserved amounts.
 */
export function BalanceDisplay({
  balance,
  decimals = 10,
  symbol = "DOT",
}: {
  balance: Balance | null;
  decimals?: number;
  symbol?: string;
}) {
  if (!balance) {
    return <div className="text-zinc-500 text-sm">No balance data</div>;
  }

  // Transferable = free - frozen
  const free = BigInt(balance.free || "0");
  const frozen = BigInt(balance.frozen || "0");
  const transferable = free > frozen ? free - frozen : BigInt(0);

  const items = [
    {
      label: "Transferable",
      value: transferable.toString(),
      color: "text-polkadot-green",
    },
    { label: "Free", value: balance.free, color: "text-zinc-100" },
    { label: "Reserved", value: balance.reserved, color: "text-yellow-400" },
    { label: "Frozen", value: balance.frozen, color: "text-blue-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.label} className="card">
          <div className="text-xs text-zinc-500 mb-1">{item.label}</div>
          <div className={`text-sm font-mono ${item.color}`}>
            {formatBalance(item.value, decimals, symbol)}
          </div>
        </div>
      ))}
    </div>
  );
}
