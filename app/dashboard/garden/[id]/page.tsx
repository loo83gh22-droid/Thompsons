import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { GardenDetailClient } from "./GardenDetailClient";

export const metadata: Metadata = { title: "Garden Season | Family Nest" };

type Props = { params: Promise<{ id: string }> };

const SEASON_EMOJI: Record<string, string> = {
  spring: "🌱", summer: "☀️", fall: "🍂", winter: "❄️", "year-round": "🌿",
};

const TYPE_EMOJI: Record<string, string> = {
  vegetable: "🥦", fruit: "🍓", herb: "🌿", flower: "🌸", tree: "🌳", shrub: "🌾", other: "🌱",
};

export default async function GardenDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: { user } } = await supabase.auth.getUser();

  const [entryRes, plantsRes, photosRes, myMemberRes] = await Promise.all([
    supabase.from("garden_entries").select("id, season, year, title, notes, cover_photo_path").eq("id", id).eq("family_id", activeFamilyId).single(),
    supabase.from("garden_plants").select("id, name, type, yield_notes").eq("entry_id", id).eq("family_id", activeFamilyId).order("created_at"),
    supabase.from("garden_photos").select("id, storage_path").eq("entry_id", id).eq("family_id", activeFamilyId).order("created_at"),
    user ? supabase.from("family_members").select("id, role").eq("user_id", user.id).eq("family_id", activeFamilyId).single() : Promise.resolve({ data: null }),
  ]);

  if (!entryRes.data) notFound();

  const entry = entryRes.data;
  const plants = plantsRes.data ?? [];
  const photos = (photosRes.data ?? []).map(p => ({ id: p.id, src: `/api/storage/garden-photos/${p.storage_path}`, storagePath: p.storage_path }));
  const coverSrc = entry.cover_photo_path ? `/api/storage/garden-photos/${entry.cover_photo_path}` : null;

  const displayTitle = entry.title ?? `${entry.season.charAt(0).toUpperCase() + entry.season.slice(1)} ${entry.year}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/dashboard/garden" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Family Garden
      </Link>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        {coverSrc && (
          <div className="relative h-52 w-full">
            <Image src={coverSrc} alt={displayTitle} fill className="object-cover" />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{SEASON_EMOJI[entry.season] ?? "🌱"}</span>
            <div>
              <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">{displayTitle}</h1>
              <p className="text-sm text-[var(--muted)] capitalize">{entry.season} · {entry.year}</p>
            </div>
          </div>
          {entry.notes && <p className="mt-4 whitespace-pre-wrap text-sm text-[var(--foreground)]">{entry.notes}</p>}
        </div>
      </div>

      {/* Plants */}
      {plants.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold text-[var(--foreground)]">What we grew</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {plants.map(p => (
              <div key={p.id} className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
                <span className="text-xl">{TYPE_EMOJI[p.type ?? ""] ?? "🌱"}</span>
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{p.name}</p>
                  {p.type && <p className="text-xs capitalize text-[var(--muted)]">{p.type}</p>}
                  {p.yield_notes && <p className="mt-0.5 text-xs text-[var(--muted)]">{p.yield_notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photos + delete */}
      <GardenDetailClient
        entryId={id}
        photos={photos}
        coverPath={entry.cover_photo_path ?? null}
        myRole={myMemberRes.data?.role ?? "teen"}
      />
    </div>
  );
}
