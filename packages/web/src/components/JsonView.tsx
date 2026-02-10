"use client";

import React, { useState } from "react";

/**
 * Generic JSON viewer component.
 * Used as the fallback when no extension-specific viewer exists.
 */
export function JsonView({ data }: { data: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const json = JSON.stringify(data, null, 2);
  const isLong = json.length > 200;

  return (
    <div className="rounded-md bg-zinc-900 border border-zinc-800 overflow-hidden">
      <pre className="p-3 text-xs text-zinc-300 font-mono overflow-x-auto whitespace-pre-wrap">
        {expanded || !isLong ? json : json.slice(0, 200) + "..."}
      </pre>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-1.5 text-xs text-zinc-500 hover:text-zinc-300 border-t border-zinc-800 transition-colors"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      )}
    </div>
  );
}
