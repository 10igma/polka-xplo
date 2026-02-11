"use client";

import { useState, useEffect, useCallback } from "react";
import { ExtrinsicList } from "./ExtrinsicList";
import { TransfersTable } from "./TransfersTable";
import type { ExtrinsicSummary, TransferSummary } from "@/lib/api";
import { theme } from "@/lib/theme";

const API_BASE = "/indexer-api";

type Tab = "extrinsics" | "transfers";

/**
 * Tabbed activity panel for the account detail page.
 * Extrinsics are passed server-side; transfers are fetched client-side on demand.
 */
export function AccountActivity({
  address,
  extrinsics,
}: {
  address: string;
  extrinsics: ExtrinsicSummary[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("extrinsics");

  // Transfer state — lazy-loaded on first tab switch
  const [transfers, setTransfers] = useState<TransferSummary[] | null>(null);
  const [transferTotal, setTransferTotal] = useState(0);
  const [transferPage, setTransferPage] = useState(1);
  const [transferLoading, setTransferLoading] = useState(false);

  const pageSize = 25;

  const fetchTransfers = useCallback(
    async (page: number) => {
      setTransferLoading(true);
      try {
        const offset = (page - 1) * pageSize;
        const res = await fetch(
          `${API_BASE}/api/accounts/${encodeURIComponent(address)}/transfers?limit=${pageSize}&offset=${offset}`,
        );
        if (!res.ok) throw new Error(`${res.status}`);
        const json = await res.json();
        setTransfers(json.data ?? []);
        setTransferTotal(json.total ?? 0);
        setTransferPage(page);
      } catch {
        setTransfers([]);
        setTransferTotal(0);
      } finally {
        setTransferLoading(false);
      }
    },
    [address],
  );

  // Fetch transfers when tab is first activated
  useEffect(() => {
    if (activeTab === "transfers" && transfers === null) {
      fetchTransfers(1);
    }
  }, [activeTab, transfers, fetchTransfers]);

  const totalTransferPages = Math.ceil(transferTotal / pageSize);

  const tabClass = (tab: Tab) =>
    `flex items-center gap-2 px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
      activeTab === tab
        ? "text-zinc-100 border-b-2 border-[var(--color-accent)] -mb-px"
        : "text-zinc-500 hover:text-zinc-300"
    }`;

  return (
    <section>
      <div className="flex gap-1 mb-4 border-b border-zinc-800">
        <button className={tabClass("extrinsics")} onClick={() => setActiveTab("extrinsics")}>
          Extrinsics
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium bg-zinc-700 text-zinc-200">
            {extrinsics.length}
          </span>
        </button>
        <button className={tabClass("transfers")} onClick={() => setActiveTab("transfers")}>
          Transfers
          {transferTotal > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium bg-zinc-700 text-zinc-200">
              {transferTotal.toLocaleString()}
            </span>
          )}
        </button>
      </div>

      {activeTab === "extrinsics" && (
        <div className="card">
          {extrinsics.length > 0 ? (
            <ExtrinsicList extrinsics={extrinsics} />
          ) : (
            <p className="text-center py-8 text-zinc-500 text-sm">No extrinsics found.</p>
          )}
        </div>
      )}

      {activeTab === "transfers" && (
        <div className="card">
          {transferLoading && transfers === null ? (
            <p className="text-center py-8 text-zinc-500 text-sm">Loading transfers...</p>
          ) : transfers && transfers.length > 0 ? (
            <>
              <TransfersTable
                transfers={transfers}
                tokenSymbol={theme.tokenSymbol}
                tokenDecimals={theme.tokenDecimals}
              />
              {/* Pagination */}
              {totalTransferPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => fetchTransfers(transferPage - 1)}
                    disabled={transferPage <= 1 || transferLoading}
                    className="px-3 py-1.5 text-xs rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-zinc-400">
                    Page {transferPage} of {totalTransferPages}
                  </span>
                  <button
                    onClick={() => fetchTransfers(transferPage + 1)}
                    disabled={transferPage >= totalTransferPages || transferLoading}
                    className="px-3 py-1.5 text-xs rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-center py-8 text-zinc-500 text-sm">No transfers found.</p>
          )}
        </div>
      )}
    </section>
  );
}
