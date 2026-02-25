import { Suspense } from "react";
import { BookOpen, MapPin, GitBranch, Mic, Lock, UtensilsCrossed } from "lucide-react";
import { WorldMapSVG, WorldPin } from "./WorldMapSVG";
import { createAdminClient } from "@/src/lib/supabase/admin";

/* ── Mini UI previews for each feature card ──────────────────── */

// IMPORTANT: Only Thompson family photos approved for marketing use.
// Never replace these with photos from any other user or family.
const MARKETING_PHOTO_PATHS = [
  "69a1b499-0026-46f9-9c77-04fcafcb8538/d372f50b-bd74-4cdb-b93f-edda628a7c6b.jpeg",
  "69a1b499-0026-46f9-9c77-04fcafcb8538/d1036ff2-19f9-4a97-98c3-0d0f3f339260.jpeg",
  "69a1b499-0026-46f9-9c77-04fcafcb8538/b59ba60b-8f32-40d6-a8ec-ffff5d505f05.jpeg",
];

async function getMarketingPhotoUrls(): Promise<string[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.storage
      .from("journal-photos")
      .createSignedUrls(MARKETING_PHOTO_PATHS, 31536000); // 1 year
    return (data ?? []).map((d) => d.signedUrl).filter(Boolean);
  } catch {
    return [];
  }
}

// Fallback gradient swatches used if signed URLs are unavailable
const FALLBACK_SWATCHES = [
  "linear-gradient(135deg, #4a9b8e 0%, #2d7a6e 100%)",
  "linear-gradient(135deg, #e8a87c 0%, #d4855a 100%)",
  "linear-gradient(135deg, #6ba3be 0%, #4a8aab 100%)",
];

function JournalPreview({ photoUrls }: { photoUrls: string[] }) {
  return (
    <div className="flex h-full w-full flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold" style={{ color: "var(--foreground)" }}>
          Feb 20, 2026
        </span>
        <span className="rounded-full px-1.5 py-0.5 text-[8px]" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
          New
        </span>
      </div>
      <p className="text-[11px] font-medium" style={{ color: "var(--foreground)" }}>
        Huck&apos;s 1st Catch!
      </p>
      <p className="text-[9px] leading-snug line-clamp-2" style={{ color: "var(--muted)" }}>
        Costa Rica fishing trip — 5 photos &amp; a video from the boat
      </p>
      <div className="flex gap-1.5 mt-auto">
        {FALLBACK_SWATCHES.map((bg, i) => {
          const url = photoUrls[i];
          return url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt="" className="h-12 w-12 rounded object-cover" />
          ) : (
            <div key={i} className="h-12 w-12 rounded" style={{ background: bg }} />
          );
        })}
        <div className="h-12 w-12 rounded flex items-center justify-center" style={{ backgroundColor: "var(--border)" }}>
          <span className="text-[8px] font-semibold" style={{ color: "var(--muted)" }}>+3</span>
        </div>
      </div>
    </div>
  );
}

const BENTO_MAP_PINS: WorldPin[] = [
  { lat: 43.65,  lng: -79.38, color: "#3d6b5e", r: 3.5 }, // Toronto
  { lat: 40.71,  lng: -74.01, color: "#3d6b5e", r: 3.5 }, // New York
  { lat: 17.99,  lng: -66.61, color: "#d97706", r: 3.5 }, // Puerto Rico
  { lat: 38.72,  lng:  -9.14, color: "#3d6b5e", r: 3.5 }, // Lisbon
  { lat: 19.08,  lng:  72.88, color: "#3d6b5e", r: 3.5 }, // Mumbai
  { lat: -33.87, lng: 151.21, color: "#3d6b5e", r: 3.5 }, // Sydney
];

function MapPreview() {
  return (
    <Suspense
      fallback={
        <div className="h-full w-full" style={{ background: "#c8dff0" }} />
      }
    >
      <WorldMapSVG pins={BENTO_MAP_PINS} badge="6 pins · worldwide" />
    </Suspense>
  );
}

function TreePreview() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4">
      {/* Grandparents row */}
      <div className="flex gap-3">
        {["G", "G"].map((letter, i) => (
          <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full text-[9px] font-semibold" style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}>
            {letter}
          </div>
        ))}
      </div>
      <div className="h-3 w-px" style={{ backgroundColor: "var(--border)" }} />
      {/* Parents row */}
      <div className="flex gap-3">
        {["M", "D"].map((letter, i) => (
          <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full text-[9px] font-semibold" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
            {letter}
          </div>
        ))}
      </div>
      <div className="h-3 w-px" style={{ backgroundColor: "var(--border)" }} />
      {/* Kids row */}
      <div className="flex gap-2">
        {["E", "J", "S"].map((letter, i) => (
          <div key={i} className="flex h-7 w-7 items-center justify-center rounded-full text-[8px] font-semibold" style={{ backgroundColor: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
            {letter}
          </div>
        ))}
      </div>
    </div>
  );
}

function VoiceMemoPreview() {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-3 p-4">
      {[
        { name: "Grandma's story", duration: "3:42", color: "var(--primary)" },
        { name: "First words", duration: "0:18", color: "var(--accent)" },
      ].map((memo) => (
        <div key={memo.name} className="flex items-center gap-2 rounded-lg p-2" style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: memo.color }}>
            <span className="text-[8px]" style={{ color: "#fff" }}>&#9654;</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium truncate" style={{ color: "var(--foreground)" }}>{memo.name}</p>
            {/* Waveform bars */}
            <div className="mt-1 flex items-end gap-[2px]">
              {[3, 6, 4, 8, 5, 7, 3, 6, 8, 4, 5, 7, 3, 5, 6, 4].map((h, i) => (
                <div key={i} className="w-[3px] rounded-full" style={{ height: `${h}px`, backgroundColor: memo.color, opacity: 0.5 }} />
              ))}
            </div>
          </div>
          <span className="text-[9px] shrink-0" style={{ color: "var(--muted)" }}>{memo.duration}</span>
        </div>
      ))}
    </div>
  );
}

function TimeCapsulePreview() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--accent)", opacity: 0.9 }}>
        <Lock className="h-6 w-6" style={{ color: "#fff" }} />
      </div>
      <p className="text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>
        Letter to future Emma
      </p>
      <p className="text-[9px]" style={{ color: "var(--muted)" }}>
        Sealed by Mom
      </p>
      <div className="rounded-full px-2.5 py-1 text-[9px] font-medium" style={{ backgroundColor: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
        Opens Dec 25, 2030
      </div>
    </div>
  );
}

function RecipePreview() {
  return (
    <div className="flex h-full w-full flex-col gap-2 p-4">
      <p className="text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>
        Nana&apos;s Banana Bread
      </p>
      <p className="text-[9px] italic" style={{ color: "var(--muted)" }}>
        &quot;She always said the secret was one extra banana...&quot;
      </p>
      <div className="flex flex-col gap-1 mt-1">
        {["3 ripe bananas", "1 cup sugar", "1/3 cup butter"].map((item) => (
          <div key={item} className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
            <span className="text-[9px]" style={{ color: "var(--foreground)" }}>{item}</span>
          </div>
        ))}
        <span className="text-[8px] mt-0.5" style={{ color: "var(--muted)" }}>+ 5 more ingredients</span>
      </div>
    </div>
  );
}

/* ── Component ───────────────────────────────────────────────── */

export async function FeaturesBento() {
  const photoUrls = await getMarketingPhotoUrls();

  const features = [
    {
      icon: BookOpen,
      title: "Journal with Photos & Video",
      description:
        "Write about trips, milestones, and the everyday chaos. Attach photos and short videos of the gems, not everything.",
      Preview: () => <JournalPreview photoUrls={photoUrls} />,
    },
    {
      icon: MapPin,
      title: "Family Travel Map",
      description:
        "Pin everywhere your family has been. Vacations, birthplaces, that roadside diner everyone still talks about. Watch your map fill up over the years.",
      Preview: MapPreview,
    },
    {
      icon: GitBranch,
      title: "Family Tree",
      description:
        "Map your whole crew. Every member gets a profile with photos, birthdays, and their place in the family story. Yes, even Uncle Steve.",
      Preview: TreePreview,
    },
    {
      icon: Mic,
      title: "Voice Memos",
      description:
        "Record grandma's stories, a toddler's first words, or that bedtime song everyone knows by heart. These voices stick around forever.",
      Preview: VoiceMemoPreview,
    },
    {
      icon: Lock,
      title: "Time Capsules",
      description:
        "Write a letter to your future self or your kids. Seal it, set an unlock date, and try not to peek.",
      Preview: TimeCapsulePreview,
    },
    {
      icon: UtensilsCrossed,
      title: "Stories & Recipes",
      description:
        "Save the family stories that only get told at holidays. Keep grandma's secret recipes (with the actual story behind them).",
      Preview: RecipePreview,
    },
  ];

  return (
    <section id="features" className="py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p
            className="mb-3 text-sm font-medium uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            Features
          </p>
          <h2
            className="mb-4 text-3xl md:text-4xl lg:text-5xl"
            style={{
              fontFamily: "var(--font-display-serif)",
              color: "var(--foreground)",
              textWrap: "balance",
            }}
          >
            Everything your family will actually use
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
            Built for real families, not influencers. Every feature here? A family asked for it.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group overflow-hidden rounded-2xl transition-shadow hover:shadow-lg"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
              }}
            >
              {/* Mini UI preview */}
              <div
                className="relative h-48 overflow-hidden"
                style={{ backgroundColor: "var(--secondary)" }}
              >
                <feature.Preview />
              </div>
              <div className="p-6">
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "rgba(61,107,94,0.1)" }}
                >
                  <feature.icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
                </div>
                <h3
                  className="mb-2 text-xl"
                  style={{
                    fontFamily: "var(--font-display-serif)",
                    color: "var(--foreground)",
                  }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
