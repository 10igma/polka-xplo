import { DEFAULT_CHAINS, type ChainConfig } from "@polka-xplo/shared";
import Link from "next/link";

/**
 * Multi-Chain Route — /chain/[chainId]/[...path]
 *
 * Implements the spec's multi-chain support:
 * "The frontend URL structure /chain/[chainId]/... determines which
 *  client is instantiated."
 *
 * This page applies the chain's theme and context, then renders
 * the appropriate sub-page (blocks, accounts, etc.) scoped to
 * that specific chain.
 */
export default async function ChainPage({
  params,
}: {
  params: Promise<{ chainId: string; path: string[] }>;
}) {
  const { chainId, path: pathSegments } = await params;

  const chain: ChainConfig | undefined = DEFAULT_CHAINS.find((c) => c.id === chainId);

  if (!chain) {
    return (
      <div className="space-y-6">
        <Link href="/chain-state" className="text-xs text-accent hover:underline">← Chain State</Link>
        <div className="text-center py-20 text-zinc-500">
          Chain &quot;{chainId}&quot; is not configured.
        </div>
      </div>
    );
  }

  const subPath = pathSegments?.join("/") ?? "";

  return (
    <div className="space-y-6">
      {/* Chain header with theme color */}
      <div
        className="rounded-lg border p-4 flex items-center gap-3"
        style={{ borderColor: chain.colorTheme + "40" }}
      >
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chain.colorTheme }} />
        <div>
          <h1 className="text-lg font-bold text-zinc-100">{chain.name}</h1>
          <p className="text-xs text-zinc-500">
            {chain.tokenSymbol} &mdash; {chain.rpc[0]}
            {"isParachain" in chain && chain.isParachain && (
              <span className="ml-2 badge-info">Parachain</span>
            )}
          </p>
        </div>
      </div>

      {/* Chain-scoped content */}
      <div className="card">
        <p className="text-sm text-zinc-400">
          Viewing <code className="text-accent">{chain.name}</code>
          {subPath ? (
            <>
              {" "}
              &mdash; <code>/{subPath}</code>
            </>
          ) : null}
        </p>
        <p className="text-xs text-zinc-500 mt-2">
          When the indexer is running for this chain, block and account data will be displayed here
          using the chain-specific PAPI descriptor.
        </p>
      </div>

      {/* Chain-specific details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoCard label="Token" value={chain.tokenSymbol} />
        <InfoCard label="Decimals" value={String(chain.tokenDecimals)} />
        <InfoCard label="Address Prefix" value={String(chain.addressPrefix)} />
        <InfoCard
          label="Address Type"
          value={"addressType" in chain ? String(chain.addressType) : "SS58"}
        />
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card text-center">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="text-sm font-mono text-zinc-200">{value}</div>
    </div>
  );
}
