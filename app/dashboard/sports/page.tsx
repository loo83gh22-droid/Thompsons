import { createClient } from "@/src/lib/supabase/server";
import { SportsGallery } from "./SportsGallery";
import { AddSportsPhoto } from "./AddSportsPhoto";

export default async function SportsPage() {
  const supabase = await createClient();

  const { data: photos } = await supabase
    .from("sports_photos")
    .select("id, url, title, caption, sport, year")
    .order("sort_order");

  return (
    <div className="sports-page rounded-2xl border-2 border-[var(--sports-gold)] bg-[var(--sports-cream)] p-8 shadow-xl">
      <div className="mb-12 text-center">
        <h1 className="sports-title font-display text-4xl font-bold tracking-wide md:text-5xl">
          Thompson Athletics
        </h1>
        <p className="mt-3 text-lg text-[var(--sports-muted)]">
          Team photos, action shots, and championship moments.
        </p>
      </div>

      <div className="mb-8 flex justify-center">
        <AddSportsPhoto />
      </div>

      <div className="sports-trophy-case bg-white/30">
        <div className="sports-pennant mb-6 inline-block">
          <span className="text-sm font-semibold uppercase tracking-widest text-[var(--sports-gold)]">
            Hall of Fame
          </span>
        </div>
        <SportsGallery photos={photos || []} />
      </div>
    </div>
  );
}
