"use client";

import React from "react";
import type { AccountListItem } from "@/lib/api";
import { AddressDisplay } from "./AddressDisplay";
import { formatBalance, formatNumber } from "@/lib/format";

/**
 * Ranked accounts table — shows rank, address (with identity), balance, and extrinsic count.
 * Client component for SS58 encoding via useSS58 context.
 */
export function AccountsTable({
  accounts,
  startRank,
  tokenSymbol,
  tokenDecimals,
}: {
  accounts: AccountListItem[];
  startRank: number;
  tokenSymbol: string;
  tokenDecimals: number;
}) {
  if (accounts.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
            <th className="pb-2 pr-4 w-12">Rank</th>
            <th className="pb-2 pr-4">Account</th>
            <th className="pb-2 pr-4 text-right">Balance</th>
            <th className="pb-2 text-right">Extrinsics</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account, i) => {
            const identity = account.identity?.display;
            const totalBalance = account.balance
              ? (
                  BigInt(account.balance.free || "0") + BigInt(account.balance.reserved || "0")
                ).toString()
              : null;

            return (
              <tr key={account.address} className="table-row">
                {/* Rank */}
                <td className="py-2.5 pr-4 text-zinc-500 font-mono text-xs">{startRank + i}</td>

                {/* Address + Identity */}
                <td className="py-2.5 pr-4">
                  <div className="flex flex-col gap-0.5">
                    {identity && (
                      <span className="text-zinc-200 text-xs font-medium">{identity}</span>
                    )}
                    <AddressDisplay
                      address={account.address}
                      truncate
                      link
                      className="font-mono text-xs"
                    />
                  </div>
                </td>

                {/* Balance */}
                <td className="py-2.5 pr-4 text-right font-mono text-zinc-300">
                  {totalBalance ? (
                    formatBalance(totalBalance, tokenDecimals, tokenSymbol)
                  ) : (
                    <span className="text-zinc-600">&mdash;</span>
                  )}
                </td>

                {/* Extrinsic count */}
                <td className="py-2.5 text-right text-zinc-300">
                  {formatNumber(account.extrinsicCount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
