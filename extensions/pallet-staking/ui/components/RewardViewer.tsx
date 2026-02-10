"use client";

import React from "react";

interface RewardData {
  stash?: string;
  who?: string;
  amount?: string;
}

/**
 * Rich viewer for Staking.Rewarded events.
 * Renders a styled reward card instead of raw JSON.
 */
export default function RewardViewer({ data }: { data: RewardData }) {
  const address = data.stash ?? data.who ?? "Unknown";
  const amount = data.amount ?? "0";

  return (
    <div className="rounded-lg border border-green-700/30 bg-green-950/20 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
        <span className="text-sm font-medium text-green-400">Staking Reward</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Validator</span>
          <span className="font-mono text-zinc-200 text-xs">
            {address.slice(0, 8)}...{address.slice(-6)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Amount</span>
          <span className="font-mono text-green-300">{amount}</span>
        </div>
      </div>
    </div>
  );
}
