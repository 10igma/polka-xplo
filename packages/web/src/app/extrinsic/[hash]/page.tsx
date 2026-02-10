import { getExtrinsic } from "@/lib/api";
import { EventRenderer } from "@/components/EventRenderer";
import { JsonView } from "@/components/JsonView";
import { truncateHash, formatBalance } from "@/lib/format";

/**
 * Extrinsic Detail Page — Server Component
 * Shows the full extrinsic details, decoded args, and correlated events.
 */
export default async function ExtrinsicPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  let data;

  try {
    data = await getExtrinsic(hash);
  } catch {
    return (
      <div className="text-center py-20 text-zinc-500">
        Extrinsic not found or indexer unavailable.
      </div>
    );
  }

  const { extrinsic, events } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-zinc-100">Extrinsic Detail</h1>
        {extrinsic.success ? (
          <span className="badge-success">Success</span>
        ) : (
          <span className="badge-error">Failed</span>
        )}
      </div>

      {/* Extrinsic Info */}
      <div className="card space-y-3">
        <DetailRow label="Hash" value={extrinsic.txHash ?? "—"} mono />
        <DetailRow label="Block" value={String(extrinsic.blockHeight)} link={`/block/${extrinsic.blockHeight}`} />
        <DetailRow label="Index" value={String(extrinsic.index)} />
        <DetailRow label="Module" value={extrinsic.module} />
        <DetailRow label="Call" value={extrinsic.call} />
        <DetailRow
          label="Signer"
          value={extrinsic.signer ?? "Unsigned"}
          mono
          link={extrinsic.signer ? `/account/${extrinsic.signer}` : undefined}
        />
        <DetailRow
          label="Fee"
          value={extrinsic.fee ? formatBalance(extrinsic.fee) : "—"}
        />
      </div>

      {/* Arguments */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-100 mb-3">Arguments</h2>
        <JsonView data={extrinsic.args} />
      </section>

      {/* Correlated Events */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-100 mb-3">
          Events ({events.length})
        </h2>
        <div className="space-y-2">
          {events.map((evt) => (
            <div key={evt.id} className="card">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge-info">
                  {evt.module}.{evt.event}
                </span>
              </div>
              <EventRenderer
                module={evt.module}
                event={evt.event}
                data={evt.data}
              />
            </div>
          ))}
          {events.length === 0 && (
            <div className="text-center py-8 text-zinc-500">No events.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  link,
}: {
  label: string;
  value: string;
  mono?: boolean;
  link?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <span className="text-xs text-zinc-500 sm:w-24 shrink-0">{label}</span>
      {link ? (
        <a
          href={link}
          className={`text-sm text-polkadot-pink hover:underline break-all ${mono ? "font-mono" : ""}`}
        >
          {value}
        </a>
      ) : (
        <span
          className={`text-sm text-zinc-200 break-all ${mono ? "font-mono" : ""}`}
        >
          {value}
        </span>
      )}
    </div>
  );
}
