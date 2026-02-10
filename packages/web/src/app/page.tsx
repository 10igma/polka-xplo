import { getBlocks } from "@/lib/api";
import { BlockList } from "@/components/BlockList";
import { OmniSearch } from "@/components/OmniSearch";

/**
 * Home page: shows the Omni-Search bar and a list of recent blocks.
 * Rendered as a Server Component for fast initial load + SEO.
 */
export default async function HomePage() {
  let blocks;
  let error: string | null = null;

  try {
    const result = await getBlocks(20, 0);
    blocks = result.data;
  } catch {
    error = "Unable to connect to the indexer. Is the backend running?";
    blocks = [];
  }

  return (
    <div className="space-y-8">
      {/* Hero search */}
      <section className="py-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-zinc-100">
          Polkadot Block Explorer
        </h1>
        <p className="text-sm text-zinc-400">
          Search transactions, accounts, and balances across the Polkadot ecosystem
        </p>
        <OmniSearch />
      </section>

      {/* Sync status banner */}
      {error && (
        <div className="rounded-lg border border-yellow-800/50 bg-yellow-950/30 p-3 text-sm text-yellow-300">
          {error}
        </div>
      )}

      {/* Recent blocks */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-100">Recent Blocks</h2>
          {blocks.length > 0 && (
            <span className="text-xs text-zinc-500">
              Showing latest {blocks.length} blocks
            </span>
          )}
        </div>
        <div className="card">
          <BlockList blocks={blocks} />
        </div>
      </section>
    </div>
  );
}
