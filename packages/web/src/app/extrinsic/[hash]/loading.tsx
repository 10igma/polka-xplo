import { SkeletonPageHeader, SkeletonCard } from "@/components/Skeleton";

export default function ExtrinsicDetailLoading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      <SkeletonCard className="h-48" />
      <SkeletonCard className="h-40" />
    </div>
  );
}
