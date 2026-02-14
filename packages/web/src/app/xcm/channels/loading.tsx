import { SkeletonPageHeader, SkeletonTable, SkeletonBar } from "@/components/Skeleton";

export default function XcmListLoading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      <div className="flex gap-2">
        <SkeletonBar className="h-7 w-16" />
        <SkeletonBar className="h-7 w-20" />
        <SkeletonBar className="h-7 w-20" />
      </div>
      <SkeletonTable rows={10} cols={7} />
    </div>
  );
}
