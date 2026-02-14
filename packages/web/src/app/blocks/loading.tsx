import { SkeletonPageHeader, SkeletonTable } from "@/components/Skeleton";

/** Blocks list loading skeleton. */
export default function BlocksLoading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      <SkeletonTable rows={10} cols={6} />
    </div>
  );
}
