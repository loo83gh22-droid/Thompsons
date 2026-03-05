import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";

export const metadata = { title: "Photo | Family Nest" };

export default async function PhotoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: photo } = await supabase
    .from("home_mosaic_photos")
    .select("id, url, created_at")
    .eq("id", id)
    .eq("family_id", activeFamilyId)
    .single();

  if (!photo) notFound();

  const date = new Date(photo.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <div className="w-full max-w-4xl">
        <Link
          href="/dashboard/photos"
          className="inline-block text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← Photos
        </Link>
        <div className="relative mt-6 w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-black/5 shadow-lg">
          <Image
            src={photo.url}
            alt="Family photo"
            width={1200}
            height={900}
            unoptimized
            className="h-auto w-full object-contain"
            priority
          />
        </div>
        <p className="mt-3 text-center text-sm text-[var(--muted)]">{date}</p>
      </div>
    </div>
  );
}
