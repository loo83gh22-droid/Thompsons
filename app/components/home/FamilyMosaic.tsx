import { createClient } from "@/src/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { Camera, BookOpen, MapPin, Mic, Heart, UtensilsCrossed } from "lucide-react";

// Deterministic pseudo-random rotation and offset for the pinned-up aesthetic
function rotationFor(i: number) {
  return ((i * 17 + 7) % 37) - 18;
}
function offsetFor(i: number) {
  return ((i * 13 + 3) % 11) - 5;
}

/* ── Static fallback when no mosaic photos exist ─────────────── */

const placeholderCards = [
  { icon: Camera, label: "Beach day photos", color: "hsl(200,55%,65%)" },
  { icon: BookOpen, label: "Family journal", color: "hsl(160,36%,40%)" },
  { icon: Heart, label: "Nana's birthday", color: "hsl(24,65%,48%)" },
  { icon: MapPin, label: "Summer road trip", color: "hsl(280,40%,55%)" },
  { icon: Mic, label: "Grandpa's story", color: "hsl(160,36%,30%)" },
  { icon: UtensilsCrossed, label: "Secret recipe", color: "hsl(35,60%,50%)" },
  { icon: Camera, label: "First steps!", color: "hsl(340,50%,55%)" },
  { icon: Heart, label: "Holiday dinner", color: "hsl(24,55%,42%)" },
];

function MosaicFallback() {
  return (
    <section className="py-16 md:py-24 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p
            className="mb-3 text-sm font-medium uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            A Peek Inside
          </p>
          <h2
            className="mb-4 text-3xl md:text-4xl"
            style={{
              fontFamily: "var(--font-display-serif)",
              color: "var(--foreground)",
              textWrap: "balance",
            }}
          >
            Your Nest starts empty. Your family fills it up.
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
            Photos, journals, voice memos, recipes — every memory finds a home here.
          </p>
        </div>

        {/* Placeholder card grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 place-items-center">
          {placeholderCards.map((card, i) => (
            <div
              key={i}
              className="relative aspect-[4/5] w-full max-w-[240px]"
              style={{
                transform: `rotate(${rotationFor(i)}deg) translate(${offsetFor(i)}px, ${offsetFor(i + 1)}px)`,
              }}
            >
              <div
                className="relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-sm bg-white p-4 shadow-[2px_6px_16px_rgba(0,0,0,0.12)]"
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: card.color, opacity: 0.15 }}
                >
                  <card.icon
                    className="h-7 w-7"
                    style={{ color: card.color, opacity: 1 }}
                  />
                </div>
                <p
                  className="text-center text-xs font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  {card.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/login?mode=signup"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: "var(--accent)" }}
          >
            Start your Nest and make it yours
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Main component ──────────────────────────────────────────── */

export async function FamilyMosaic() {
  let urls: string[] = [];
  try {
    const supabase = await createClient();
    const { data: photos } = await supabase
      .from("home_mosaic_photos")
      .select("id, url")
      .order("sort_order")
      .limit(12);
    urls = (photos || []).map((p) => p.url);
  } catch {
    // Graceful fallback if table doesn't exist yet
  }

  if (urls.length === 0) return <MosaicFallback />;

  return (
    <section className="py-16 md:py-24 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p
            className="mb-3 text-sm font-medium uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            A Peek Inside
          </p>
          <h2
            className="mb-4 text-3xl md:text-4xl"
            style={{
              fontFamily: "var(--font-display-serif)",
              color: "var(--foreground)",
              textWrap: "balance",
            }}
          >
            This is what a family&apos;s Nest looks like
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
            Real photos from real families. Yours could look even better.
          </p>
        </div>

        {/* Photo collage grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 place-items-center">
          {urls.map((url, i) => (
            <div
              key={i}
              className="relative aspect-[4/5] w-full max-w-[240px]"
              style={{
                transform: `rotate(${rotationFor(i)}deg) translate(${offsetFor(i)}px, ${offsetFor(i + 1)}px)`,
              }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-sm bg-white p-1.5 shadow-[2px_6px_16px_rgba(0,0,0,0.12)]">
                <Image
                  src={url}
                  alt="Family moment"
                  fill
                  className="object-cover rounded-sm"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Caption */}
        <p
          className="mt-10 text-center text-sm"
          style={{ color: "var(--muted)" }}
        >
          Every family&apos;s Nest is unique. Start yours and fill it with your own moments.
        </p>
      </div>
    </section>
  );
}
