"use client";

import React from "react";

interface DigestLog {
  type: string;
  engine: string | null;
  data: string;
}

/**
 * Digest log list for block detail pages.
 * Shows each log with index, type, engine, and expandable hex data.
 * Mirrors statescan.io's Logs tab layout.
 */
export function LogList({
  logs,
  blockHeight,
}: {
  logs: DigestLog[];
  blockHeight: number;
}) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">No logs found.</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
            <th className="pb-2 pr-4">ID</th>
            <th className="pb-2 pr-4">Block</th>
            <th className="pb-2 pr-4">Type</th>
            <th className="pb-2 pr-4">Engine</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, i) => (
            <LogRow key={i} log={log} index={i} blockHeight={blockHeight} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LogRow({
  log,
  index,
  blockHeight,
}: {
  log: DigestLog;
  index: number;
  blockHeight: number;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const hasData = log.data && log.data.length > 2; // more than just "0x"

  return (
    <>
      <tr
        className="table-row cursor-pointer"
        onClick={() => hasData && setExpanded(!expanded)}
      >
        <td className="py-2.5 pr-4 font-mono text-xs text-zinc-400">
          {blockHeight}-{index}
        </td>
        <td className="py-2.5 pr-4 text-zinc-400 text-xs">
          {blockHeight.toLocaleString()}
        </td>
        <td className="py-2.5 pr-4">
          <span className="badge-info">{log.type}</span>
        </td>
        <td className="py-2.5 pr-4 font-mono text-xs text-zinc-300">
          {log.engine ?? "—"}
        </td>
        <td className="py-2.5">
          {hasData && (
            <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className={`transform transition-transform ${expanded ? "rotate-90" : ""}`}
              >
                <path
                  d="M7.166 11.333L10.5 8L7.166 4.667"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </td>
      </tr>
      {expanded && hasData && (
        <tr>
          <td colSpan={5} className="pb-3 pt-0 px-4">
            <div className="rounded-lg bg-zinc-800/50 p-3 border border-zinc-700/50">
              <pre className="text-xs text-zinc-400 font-mono break-all whitespace-pre-wrap">
                {log.data}
              </pre>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
