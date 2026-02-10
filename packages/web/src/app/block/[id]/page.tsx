import { getBlock } from "@/lib/api";
import { ExtrinsicList } from "@/components/ExtrinsicList";
import { EventRenderer } from "@/components/EventRenderer";
import {
  truncateHash,
  formatNumber,
  formatDate,
  timeAgo,
} from "@/lib/format";

/**
 * Block Detail Page — Server Component
 * Renders block header, extrinsics table, and event list.
 * Immutable finalized blocks are effectively static and highly cacheable.
 */
export default async function BlockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data;

  try {
    data = await getBlock(id);
  } catch {
    return (
      <div className="text-center py-20 text-zinc-500">
        Block not found or indexer unavailable.
      </div>
    );
  }

  const { block, extrinsics, events } = data;

  return (
    <div className="space-y-6">
      {/* Block Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-zinc-100">
          Block #{formatNumber(block.height)}
        </h1>
        <span
          className={
            block.status === "finalized" ? "badge-success" : "badge-info"
          }
        >
          {block.status}
        </span>
      </div>

      {/* Block Details Card */}
      <div className="card space-y-3">
        <DetailRow label="Block Hash" value={block.hash} mono />
        <DetailRow label="Parent Hash" value={block.parentHash} mono />
        <DetailRow label="State Root" value={truncateHash(block.stateRoot, 10)} mono />
        <DetailRow
          label="Extrinsics Root"
          value={truncateHash(block.extrinsicsRoot, 10)}
          mono
        />
        <DetailRow
          label="Timestamp"
          value={
            block.timestamp
              ? `${formatDate(block.timestamp)} (${timeAgo(block.timestamp)})`
              : "—"
          }
        />
        <DetailRow
          label="Spec Version"
          value={String(block.specVersion)}
        />
        <DetailRow
          label="Validator"
          value={block.validatorId ?? "—"}
          mono
        />
      </div>

      {/* Extrinsics */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-100 mb-3">
          Extrinsics ({extrinsics.length})
        </h2>
        <div className="card">
          <ExtrinsicList extrinsics={extrinsics} />
        </div>
      </section>

      {/* Events */}
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
                {evt.extrinsicId && (
                  <span className="text-xs text-zinc-500">
                    Extrinsic: {evt.extrinsicId}
                  </span>
                )}
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
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <span className="text-xs text-zinc-500 sm:w-40 shrink-0">{label}</span>
      <span
        className={`text-sm text-zinc-200 break-all ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
