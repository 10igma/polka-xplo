import React from "react";
import type { EventSummary } from "@/lib/api";
import { formatNumber } from "@/lib/format";

/**
 * Events table — shows event ID, block, module.event, extrinsic link,
 * and a truncated data preview.
 */
export function EventsTable({ events }: { events: EventSummary[] }) {
  if (events.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
            <th className="pb-2 pr-4">ID</th>
            <th className="pb-2 pr-4">Block</th>
            <th className="pb-2 pr-4">Event</th>
            <th className="pb-2 pr-4">Extrinsic</th>
            <th className="pb-2">Data</th>
          </tr>
        </thead>
        <tbody>
          {events.map((evt) => (
            <tr key={evt.id} className="table-row">
              <td className="py-2.5 pr-4 font-mono text-xs text-zinc-400">
                {evt.id}
              </td>
              <td className="py-2.5 pr-4">
                <a
                  href={`/block/${evt.blockHeight}`}
                  className="text-accent hover:underline font-mono text-xs"
                >
                  #{formatNumber(evt.blockHeight)}
                </a>
              </td>
              <td className="py-2.5 pr-4">
                <span className="inline-flex items-center gap-1">
                  <a
                    href={`/events?module=${evt.module}`}
                    className="text-zinc-400 hover:text-zinc-200 text-xs"
                  >
                    {evt.module}
                  </a>
                  <span className="text-zinc-600">.</span>
                  <span className="text-zinc-200 text-xs">{evt.event}</span>
                </span>
              </td>
              <td className="py-2.5 pr-4">
                {evt.extrinsicId ? (
                  <a
                    href={`/extrinsic/${evt.extrinsicId}`}
                    className="text-accent hover:underline font-mono text-xs"
                  >
                    {evt.extrinsicId}
                  </a>
                ) : (
                  <span className="text-zinc-600 text-xs">&mdash;</span>
                )}
              </td>
              <td className="py-2.5 max-w-[300px]">
                <span
                  className="text-xs text-zinc-500 truncate block"
                  title={JSON.stringify(evt.data)}
                >
                  {summarizeData(evt.data)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Produce a compact one-line summary of event data */
function summarizeData(data: Record<string, unknown>): string {
  const keys = Object.keys(data);
  if (keys.length === 0) return "{}";
  const parts = keys.slice(0, 3).map((k) => {
    const v = data[k];
    const s = typeof v === "string" && v.length > 20 ? v.slice(0, 12) + "..." : String(v);
    return `${k}: ${s}`;
  });
  return `{${parts.join(", ")}${keys.length > 3 ? ", ..." : ""}}`;
}
