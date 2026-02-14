/**
 * Reusable skeleton / shimmer primitives for loading states.
 * Built with Tailwind's `animate-pulse` for a subtle breathing effect.
 */

/** A single rounded shimmer bar. */
export function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-zinc-800 ${className}`} />;
}

/** Page-header placeholder (back link + title + subtitle). */
export function SkeletonPageHeader() {
  return (
    <div className="space-y-2">
      <SkeletonBar className="h-3 w-20" />
      <SkeletonBar className="h-7 w-48" />
      <SkeletonBar className="h-4 w-32" />
    </div>
  );
}

/** Table placeholder with N rows. */
export function SkeletonTable({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden">
      {/* Header row */}
      <div className="flex gap-4 border-b border-zinc-800 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBar key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Body rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-zinc-800/50 px-4 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBar key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Card placeholder (used for stat cards, overview panels, etc.). */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`card space-y-3 ${className}`}>
      <SkeletonBar className="h-4 w-24" />
      <SkeletonBar className="h-6 w-36" />
      <SkeletonBar className="h-4 w-full" />
      <SkeletonBar className="h-4 w-3/4" />
    </div>
  );
}
