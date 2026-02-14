import { SkeletonPageHeader, SkeletonCard } from "@/components/Skeleton";

export default function BlockDetailLoading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      <SkeletonCard className="h-40" />
      <SkeletonCard className="h-64" />
    </div>
  );
}
