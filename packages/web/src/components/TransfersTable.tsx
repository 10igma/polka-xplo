"use client";

import React from "react";
import type { TransferSummary } from "@/lib/api";
import { AddressDisplay } from "./AddressDisplay";
import { formatBalance, formatNumber, timeAgo } from "@/lib/format";

/**
 * Transfers table — shows block, from, to, amount, time.
 */
export function TransfersTable({
  transfers,
  tokenSymbol,
  tokenDecimals,
}: {
  transfers: TransferSummary[];
  tokenSymbol: string;
  tokenDecimals: number;
}) {
  if (transfers.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
            <th className="pb-2 pr-4">Extrinsic</th>
            <th className="pb-2 pr-4">Block</th>
            <th className="pb-2 pr-4">From</th>
            <th className="pb-2 pr-4">To</th>
            <th className="pb-2 pr-4 text-right">Amount</th>
            <th className="pb-2 text-right">Time</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((tx, i) => (
            <tr key={`${tx.extrinsicId}-${i}`} className="table-row">
              <td className="py-2.5 pr-4">
                <a
                  href={`/extrinsic/${tx.extrinsicId}`}
                  className="text-accent hover:underline font-mono text-xs"
                >
                  {tx.extrinsicId}
                </a>
              </td>
              <td className="py-2.5 pr-4">
                <a
                  href={`/block/${tx.blockHeight}`}
                  className="text-accent hover:underline font-mono text-xs"
                >
                  #{formatNumber(tx.blockHeight)}
                </a>
              </td>
              <td className="py-2.5 pr-4">
                {tx.from ? (
                  <AddressDisplay address={tx.from} truncate link className="font-mono text-xs" />
                ) : (
                  <span className="text-zinc-600 text-xs">&mdash;</span>
                )}
              </td>
              <td className="py-2.5 pr-4">
                {tx.to ? (
                  <AddressDisplay address={tx.to} truncate link className="font-mono text-xs" />
                ) : (
                  <span className="text-zinc-600 text-xs">&mdash;</span>
                )}
              </td>
              <td className="py-2.5 pr-4 text-right font-mono text-xs text-zinc-200">
                {formatBalance(tx.amount, tokenDecimals, tokenSymbol)}
              </td>
              <td className="py-2.5 text-right text-xs text-zinc-500">{timeAgo(tx.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
