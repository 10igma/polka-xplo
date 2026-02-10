import { getAccount } from "@/lib/api";
import { BalanceDisplay } from "@/components/BalanceDisplay";
import { ExtrinsicList } from "@/components/ExtrinsicList";
import { truncateHash, formatNumber } from "@/lib/format";

/**
 * Account Detail Page — Server Component
 * Shows account identity, balance breakdown, and recent activity.
 * Combines static DB data with the option for live PAPI balance updates.
 */
export default async function AccountPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  let data;

  try {
    data = await getAccount(address);
  } catch {
    return (
      <div className="text-center py-20 text-zinc-500">
        Account not found or indexer unavailable.
      </div>
    );
  }

  const { account, balance, recentExtrinsics } = data;

  return (
    <div className="space-y-6">
      {/* Account Header */}
      <div className="flex items-center gap-4">
        {/* Identicon placeholder */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-polkadot-pink to-polkadot-purple flex items-center justify-center text-white text-lg font-bold">
          {address.slice(0, 2)}
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">
            {account.identity?.display ?? "Account"}
          </h1>
          <p className="text-xs font-mono text-zinc-400 break-all">
            {address}
          </p>
        </div>
      </div>

      {/* Balance Section */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-100 mb-3">Balance</h2>
        <BalanceDisplay balance={balance} />
      </section>

      {/* Account Info */}
      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300 mb-2">Details</h2>
        <DetailRow
          label="Public Key"
          value={account.publicKey ?? "—"}
          mono
        />
        <DetailRow
          label="First Seen"
          value={`Block #${formatNumber(account.createdAtBlock)}`}
        />
        <DetailRow
          label="Last Active"
          value={`Block #${formatNumber(account.lastActiveBlock)}`}
        />
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-100 mb-3">
          Recent Activity
        </h2>
        <div className="card">
          <ExtrinsicList extrinsics={recentExtrinsics} />
        </div>
      </section>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <span className="text-xs text-zinc-500 sm:w-32 shrink-0">{label}</span>
      <span
        className={`text-sm text-zinc-200 break-all ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
