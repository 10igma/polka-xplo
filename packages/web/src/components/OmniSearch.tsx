"use client";

import React, { useState, useCallback } from "react";
import { search, type SearchResponse } from "@/lib/api";

/**
 * The Omni-Search component: a smart search bar that detects
 * input type (hash, block number, address) and routes to the
 * appropriate page.
 */
export function OmniSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse["results"]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await search(q);
      setResults(res.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doSearch(query);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search by block number, hash, or address..."
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all"
      />

      {loading && (
        <div className="absolute right-3 top-3.5">
          <div className="w-4 h-4 border-2 border-zinc-600 border-t-accent rounded-full animate-spin" />
        </div>
      )}

      {results.length > 0 && (
        <div className="absolute top-full mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl z-50">
          {results.map((result) => (
            <a
              key={result.id}
              href={result.url}
              className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <TypeBadge type={result.type} />
              <span className="text-sm text-zinc-200 truncate">
                {result.label}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    block: "bg-blue-950 text-blue-400 border-blue-800/50",
    extrinsic: "bg-purple-950 text-purple-400 border-purple-800/50",
    account: "bg-green-950 text-green-400 border-green-800/50",
  };

  return (
    <span
      className={`badge border ${colors[type] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
    >
      {type}
    </span>
  );
}
