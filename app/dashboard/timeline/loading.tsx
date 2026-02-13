import { SkeletonPageHeader, SkeletonTimeline } from "@/app/components/ui/skeletons";

export default function TimelineLoading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      <SkeletonTimeline count={5} />
    </div>
  );
}
