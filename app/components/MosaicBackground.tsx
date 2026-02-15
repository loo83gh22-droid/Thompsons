import { createClient } from "@/src/lib/supabase/server";
import { PHOTO_LIMITS } from "@/src/lib/constants";
import Image from "next/image";

// Deterministic "random" values for SSR - dorm room pinned-up vibe
function rotationFor(i: number) {
  return ((i * 17 + 7) % 37) - 18;
}
function offsetFor(i: number) {
  return ((i * 13 + 3) % 11) - 5; // -5 to 5px
}

export async function MosaicBackground() {
  let urls: string[] = [];
  try {
    const supabase = await createClient();
    const { data: photos } = await supabase
      .from("home_mosaic_photos")
      .select("id, url")
      .order("sort_order")
      .limit(PHOTO_LIMITS.mosaicDisplayLimit);
    urls = (photos || []).map((p) => p.url);
  } catch {
    // Table may not exist yet or Supabase unavailable - use fallback
  }
  const tiles = urls.length
    ? Array.from({ length: Math.min(urls.length * 2, 24) }, (_, i) => ({
        url: urls[i % urls.length],
        rotation: rotationFor(i),
        offsetX: offsetFor(i),
        offsetY: offsetFor(i + 1),
      }))
    : [];

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      {tiles.length > 0 ? (
        <div className="grid h-full w-full grid-cols-3 grid-rows-2 place-items-center gap-2 p-4 sm:grid-cols-4 sm:grid-rows-3 sm:gap-4 md:grid-cols-5 md:grid-rows-4 md:gap-6 lg:grid-cols-6 lg:grid-rows-4 lg:gap-8">
          {tiles.map(({ url, rotation, offsetX, offsetY }, i) => (
            <div
              key={i}
              className="relative flex aspect-[4/5] w-full max-w-[180px] items-center justify-center sm:max-w-[220px] md:max-w-[260px] lg:max-w-[280px]"
              style={{
                transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`,
              }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-sm bg-white p-1.5 shadow-[2px_6px_16px_rgba(0,0,0,0.15)]">
                <Image
                  src={url}
                  alt=""
                  role="presentation"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="h-full w-full opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23806040' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      )}
      {/* Warm overlay for readability */}
      <div className="absolute inset-0 bg-[var(--background)]/80" />
    </div>
  );
}
