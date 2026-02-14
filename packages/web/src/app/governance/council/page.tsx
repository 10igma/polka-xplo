import { getCouncilMotions, type GovernanceMotion } from "@/lib/api";
import { Pagination } from "@/components/Pagination";
import { truncateHash } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  proposed: "badge-info",
  approved: "badge-success",
  executed: "badge-success",
  closed: "badge-neutral",
  disapproved: "badge-error",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status.toLowerCase()] ?? "badge-info";
  return (
    <span className={cls}>
      {status}
    </span>
  );
}

export default async function CouncilMotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { page: pageStr, status } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const limit = 25;
  const offset = (page - 1) * limit;

  let motions: GovernanceMotion[] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const res = await getCouncilMotions(limit, offset, status);
    motions = res.data;
    total = res.total;
  } catch {
    error = "Unable to load council motions.";
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/governance" className="text-xs text-accent hover:underline">
          ← Governance
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100 mt-1">Council Motions</h1>
        <p className="text-sm text-zinc-400 mt-0.5">{total} total motions</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "proposed", "approved", "executed", "closed"].map((s) => (
          <Link
            key={s}
            href={
              s === "all"
                ? "/governance/council"
                : `/governance/council?status=${s}`
            }
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              (s === "all" && !status) || status === s
                ? "bg-accent/20 text-accent border border-accent/40"
                : "bg-zinc-800/40 text-zinc-400 hover:text-zinc-100 border border-zinc-700/40"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-yellow-800/50 bg-yellow-950/30 p-3 text-sm text-yellow-300">
          {error}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-500 border-b border-zinc-800">
              <th className="pb-2 pr-4">#</th>
              <th className="pb-2 pr-4">Hash</th>
              <th className="pb-2 pr-4">Proposer</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 pr-4 text-center">Threshold</th>
              <th className="pb-2 pr-4 text-right">Ayes</th>
              <th className="pb-2 text-right">Nays</th>
            </tr>
          </thead>
          <tbody>
            {motions.map((m) => (
              <tr key={m.proposal_index} className="table-row">
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/governance/council/${m.proposal_index}`}
                    className="text-accent hover:underline font-mono"
                  >
                    {m.proposal_index}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 font-mono text-xs text-zinc-300">
                  {truncateHash(m.proposal_hash, 8)}
                </td>
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/account/${m.proposer}`}
                    className="text-accent hover:underline font-mono text-xs"
                  >
                    {truncateHash(m.proposer, 6)}
                  </Link>
                </td>
                <td className="py-2.5 pr-4">
                  <StatusBadge status={m.status} />
                </td>
                <td className="py-2.5 pr-4 text-center text-zinc-300">{m.threshold}</td>
                <td className="py-2.5 pr-4 text-right text-green-400">{m.aye_count}</td>
                <td className="py-2.5 text-right text-red-400">{m.nay_count}</td>
              </tr>
            ))}
            {motions.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  No council motions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/governance/council"
        extraParams={status ? { status } : undefined}
      />
    </div>
  );
}
