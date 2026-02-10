"use client";

import React from "react";
import type { ExtrinsicSummary } from "@/lib/api";
import { AddressDisplay } from "./AddressDisplay";
import { formatBalance, formatNumber } from "@/lib/format";

/**
 * Extrinsics table with module.call, signer, fee, success status.
 */
export function ExtrinsicsTable({
  extrinsics,
  tokenSymbol,
  tokenDecimals,
}: {
  extrinsics: ExtrinsicSummary[];
  tokenSymbol: string;
  tokenDecimals: number;
}) {
  if (extrinsics.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
            <th className="pb-2 pr-4">ID</th>
            <th className="pb-2 pr-4">Block</th>
            <th className="pb-2 pr-4">Call</th>
            <th className="pb-2 pr-4">Signer</th>
            <th className="pb-2 pr-4 text-right">Fee</th>
            <th className="pb-2 text-center">Result</th>
          </tr>
        </thead>
        <tbody>
          {extrinsics.map((ext) => (
            <tr key={ext.id} className="table-row">
              <td className="py-2.5 pr-4">
                <a
                  href={`/extrinsic/${ext.id}`}
                  className="text-accent hover:underline font-mono text-xs"
                >
                  {ext.id}
                </a>
              </td>
              <td className="py-2.5 pr-4">
                <a
                  href={`/block/${ext.blockHeight}`}
                  className="text-accent hover:underline font-mono text-xs"
                >
                  #{formatNumber(ext.blockHeight)}
                </a>
              </td>
              <td className="py-2.5 pr-4">
                <span className="inline-flex items-center gap-1">
                  <span className="text-zinc-400 text-xs">{ext.module}</span>
                  <span className="text-zinc-600">.</span>
                  <span className="text-zinc-200 text-xs">{ext.call}</span>
                </span>
              </td>
              <td className="py-2.5 pr-4">
                {ext.signer ? (
                  <AddressDisplay
                    address={ext.signer}
                    truncate
                    link
                    className="font-mono text-xs"
                  />
                ) : (
                  <span className="text-zinc-600 text-xs">&mdash;</span>
                )}
              </td>
              <td className="py-2.5 pr-4 text-right font-mono text-xs text-zinc-300">
                {ext.fee ? (
                  formatBalance(ext.fee, tokenDecimals, tokenSymbol)
                ) : (
                  <span className="text-zinc-600">&mdash;</span>
                )}
              </td>
              <td className="py-2.5 text-center">
                {ext.success ? (
                  <span
                    className="inline-block w-2 h-2 rounded-full bg-green-500"
                    title="Success"
                  />
                ) : (
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500" title="Failed" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
