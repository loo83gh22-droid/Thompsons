import { SkeletonCardList } from "@/app/components/ui/skeletons";

export default function EventsLoading() {
  return <SkeletonCardList count={3} />;
}
