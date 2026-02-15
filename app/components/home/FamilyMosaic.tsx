import { createClient } from "@/src/lib/supabase/server";
import Image from "next/image";

// Deterministic pseudo-random rotation and offset for the pinned-up aesthetic
function rotationFor(i: number) {
  return ((i * 17 + 7) % 37) - 18;
}
function offsetFor(i: number) {
  return ((i * 13 + 3) % 11) - 5;
}

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

  if (urls.length === 0) return null;

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
