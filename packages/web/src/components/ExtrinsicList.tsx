import React from "react";
import type { ExtrinsicSummary } from "@/lib/api";
import { truncateHash } from "@/lib/format";

export function ExtrinsicList({
  extrinsics,
}: {
  extrinsics: ExtrinsicSummary[];
}) {
  if (extrinsics.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">No extrinsics found.</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
            <th className="pb-2 pr-4">ID</th>
            <th className="pb-2 pr-4">Hash</th>
            <th className="pb-2 pr-4">Module</th>
            <th className="pb-2 pr-4">Call</th>
            <th className="pb-2 pr-4">Signer</th>
            <th className="pb-2">Result</th>
          </tr>
        </thead>
        <tbody>
          {extrinsics.map((ext) => (
            <tr key={ext.id} className="table-row">
              <td className="py-2.5 pr-4 font-mono text-xs text-zinc-400">
                {ext.id}
              </td>
              <td className="py-2.5 pr-4">
                {ext.txHash ? (
                  <a
                    href={`/extrinsic/${ext.txHash}`}
                    className="text-polkadot-pink hover:underline font-mono text-xs"
                  >
                    {truncateHash(ext.txHash)}
                  </a>
                ) : (
                  <span className="text-zinc-500 text-xs">—</span>
                )}
              </td>
              <td className="py-2.5 pr-4">
                <span className="badge-info">{ext.module}</span>
              </td>
              <td className="py-2.5 pr-4 text-zinc-300">{ext.call}</td>
              <td className="py-2.5 pr-4 font-mono text-xs text-zinc-400">
                {ext.signer ? truncateHash(ext.signer) : "—"}
              </td>
              <td className="py-2.5">
                {ext.success ? (
                  <span className="badge-success">Success</span>
                ) : (
                  <span className="badge-error">Failed</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
