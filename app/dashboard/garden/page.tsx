import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";

export const metadata: Metadata = { title: "Family Garden | Family Nest" };

const SEASON_EMOJI: Record<string, string> = {
  spring: "🌱",
  summer: "☀️",
  fall: "🍂",
  winter: "❄️",
  "year-round": "🌿",
};

export default async function GardenPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: entries } = await supabase
    .from("garden_entries")
    .select("id, season, year, title, notes, cover_photo_path")
    .eq("family_id", activeFamilyId)
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  const entryIds = (entries ?? []).map(e => e.id);
  const { data: plants } = entryIds.length > 0
    ? await supabase
        .from("garden_plants")
        .select("entry_id, name, type")
        .in("entry_id", entryIds)
    : { data: [] };

  const plantsByEntry = new Map<string, { name: string; type: string | null }[]>();
  for (const p of (plants ?? [])) {
    if (!plantsByEntry.has(p.entry_id)) plantsByEntry.set(p.entry_id, []);
    plantsByEntry.get(p.entry_id)!.push({ name: p.name, type: p.type });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Family Garden 🌱</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Season by season — what you grew, what bloomed, what was just for joy.</p>
        </div>
        <Link href="/dashboard/garden/new" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          + Add season
        </Link>
      </div>

      {(!entries || entries.length === 0) && (
        <div className="mt-20 text-center">
          <div className="text-5xl">🌷</div>
          <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">No garden seasons yet</h2>
          <p className="mt-2 text-sm text-[var(--muted)] max-w-sm mx-auto">
            Whether you grow tomatoes for the table or sunflowers just because — document what your family grows.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/dashboard/garden/new" className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90">
              + Add your first season
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {(entries ?? []).map(entry => {
          const ep = plantsByEntry.get(entry.id) ?? [];
          const coverSrc = entry.cover_photo_path ? `/api/storage/garden-photos/${entry.cover_photo_path}` : null;

          return (
            <Link
              key={entry.id}
              href={`/dashboard/garden/${entry.id}`}
              className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition hover:border-[var(--accent)] hover:shadow-sm"
            >
              {/* Cover */}
              <div className="relative h-36 w-full bg-[var(--surface)]">
                {coverSrc ? (
                  <Image src={coverSrc} alt={entry.title ?? "Garden"} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl">
                    {SEASON_EMOJI[entry.season] ?? "🌱"}
                  </div>
                )}
              </div>
              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{SEASON_EMOJI[entry.season] ?? "🌱"}</span>
                  <h2 className="font-display text-base font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">
                    {entry.title ?? `${entry.season.charAt(0).toUpperCase() + entry.season.slice(1)} ${entry.year}`}
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-[var(--muted)] capitalize">{entry.season} {entry.year}</p>
                {ep.length > 0 && (
                  <p className="mt-2 text-sm text-[var(--muted)] truncate">
                    {ep.slice(0, 5).map(p => p.name).join(", ")}
                    {ep.length > 5 && ` +${ep.length - 5} more`}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
