/**
 * Shared skeleton components for loading states.
 * Uses Tailwind animate-pulse with the existing dark slate palette.
 */

/* ------------------------------------------------------------------ */
/* Primitives                                                         */
/* ------------------------------------------------------------------ */

function Bone({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--border)] ${className}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/* SkeletonCard                                                       */
/* ------------------------------------------------------------------ */

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Bone className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-3/5" />
          <Bone className="h-3 w-2/5" />
        </div>
      </div>
      <Bone className="h-3 w-full" />
      <Bone className="h-3 w-4/5" />
      <Bone className="h-3 w-3/5" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SkeletonTimeline                                                   */
/* ------------------------------------------------------------------ */

function SkeletonTimelineItem() {
  return (
    <div className="flex gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <Bone className="h-20 w-20 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2 py-1">
        <Bone className="h-3 w-24" />
        <Bone className="h-4 w-3/4" />
        <Bone className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonTimeline({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTimelineItem key={i} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SkeletonPhotoGrid                                                  */
/* ------------------------------------------------------------------ */

export function SkeletonPhotoGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Bone key={i} className="aspect-square rounded-lg" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SkeletonForm                                                       */
/* ------------------------------------------------------------------ */

export function SkeletonForm() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5">
      {/* Field 1 */}
      <div className="space-y-2">
        <Bone className="h-3 w-20" />
        <Bone className="h-10 w-full rounded-lg" />
      </div>
      {/* Field 2 */}
      <div className="space-y-2">
        <Bone className="h-3 w-28" />
        <Bone className="h-10 w-full rounded-lg" />
      </div>
      {/* Textarea */}
      <div className="space-y-2">
        <Bone className="h-3 w-24" />
        <Bone className="h-28 w-full rounded-lg" />
      </div>
      {/* Button */}
      <Bone className="h-10 w-32 rounded-lg" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SkeletonMapPlaceholder                                             */
/* ------------------------------------------------------------------ */

export function SkeletonMap() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Bone className="h-8 w-48" />
        <Bone className="h-8 w-24 rounded-lg" />
      </div>
      <Bone className="aspect-[16/9] w-full rounded-xl" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SkeletonPageHeader                                                 */
/* ------------------------------------------------------------------ */

export function SkeletonPageHeader() {
  return (
    <div className="space-y-2">
      <Bone className="h-8 w-56" />
      <Bone className="h-4 w-80" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Composed page skeletons                                            */
/* ------------------------------------------------------------------ */

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      {/* Activity feed */}
      <SkeletonTimeline count={4} />
    </div>
  );
}

export function SkeletonCardList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      <SkeletonPageHeader />
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
