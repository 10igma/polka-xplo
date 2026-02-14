import { SkeletonPageHeader, SkeletonTable } from "@/components/Skeleton";

export default function EventsLoading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      <SkeletonTable rows={10} cols={5} />
    </div>
  );
}
