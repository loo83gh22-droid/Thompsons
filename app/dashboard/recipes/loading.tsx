import { SkeletonCardList } from "@/app/components/ui/skeletons";

export default function RecipesLoading() {
  return <SkeletonCardList count={3} />;
}
