import { SkeletonPageHeader, SkeletonPhotoGrid } from "@/app/components/ui/skeletons";

export default function PhotosLoading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      <SkeletonPhotoGrid count={8} />
    </div>
  );
}
