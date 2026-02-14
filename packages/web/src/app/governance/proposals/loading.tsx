import { SkeletonPageHeader, SkeletonTable } from "@/components/Skeleton";
import { SkeletonBar } from "@/components/Skeleton";

export default function GovernanceListLoading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      {/* Filter buttons placeholder */}
      <div className="flex gap-2">
        <SkeletonBar className="h-7 w-16" />
        <SkeletonBar className="h-7 w-20" />
        <SkeletonBar className="h-7 w-20" />
        <SkeletonBar className="h-7 w-24" />
      </div>
      <SkeletonTable rows={10} cols={7} />
    </div>
  );
}
