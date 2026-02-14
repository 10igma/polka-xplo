import { SkeletonPageHeader, SkeletonCard } from "@/components/Skeleton";

export default function AccountDetailLoading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard className="h-48" />
    </div>
  );
}
