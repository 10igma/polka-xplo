import { getTransfersList, type TransfersResponse } from "@/lib/api";
import { TransfersTable } from "@/components/TransfersTable";
import { theme } from "@/lib/theme";

/**
 * Transfers list page — paginated table of all balance transfer events.
 */
export default async function TransfersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const pageSize = 25;
  const page = Math.max(parseInt(params.page ?? "1", 10) || 1, 1);
  const offset = (page - 1) * pageSize;

  let transfers: TransfersResponse | null = null;
  let error: string | null = null;

  try {
    transfers = await getTransfersList(pageSize, offset);
  } catch {
    error = "Unable to fetch transfers. Is the backend running?";
  }

  const totalPages = transfers ? Math.ceil(transfers.total / pageSize) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">Transfers</h1>
        {transfers && (
          <span className="text-sm text-zinc-400">
            {transfers.total.toLocaleString()} total
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-yellow-800/50 bg-yellow-950/30 p-3 text-sm text-yellow-300">
          {error}
        </div>
      )}

      {transfers && transfers.data.length > 0 && (
        <>
          <div className="card">
            <TransfersTable
              transfers={transfers.data}
              tokenSymbol={theme.tokenSymbol}
              tokenDecimals={theme.tokenDecimals}
            />
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 text-sm">
              {page > 1 && (
                <a
                  href={`/transfers?page=${page - 1}`}
                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  &larr; Prev
                </a>
              )}
              <span className="px-3 py-1.5 text-zinc-400">
                Page {page} of {totalPages.toLocaleString()}
              </span>
              {page < totalPages && (
                <a
                  href={`/transfers?page=${page + 1}`}
                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  Next &rarr;
                </a>
              )}
            </div>
          )}
        </>
      )}

      {transfers && transfers.data.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No transfers found yet. The indexer is still syncing.
        </div>
      )}
    </div>
  );
}
