import { SkeletonCardList } from "@/app/components/ui/skeletons";

export default function StoriesLoading() {
  return <SkeletonCardList count={3} />;
}
