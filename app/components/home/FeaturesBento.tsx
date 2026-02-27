import { Suspense } from "react";
import { BookOpen, MapPin, GitBranch, Mic, Lock, UtensilsCrossed } from "lucide-react";
import { WorldMapSVG, WorldPin } from "./WorldMapSVG";

/* ── Mini UI previews for each feature card ──────────────────── */

// IMPORTANT: Only Thompson family photos approved for marketing use.
// Files live in public/marketing/ — served as static assets, no auth needed.
// Never replace these with photos from any other user or family.
const MARKETING_PHOTOS = [
  "/marketing/journal-1.jpeg",
  "/marketing/journal-2.jpeg",
  "/marketing/journal-3.jpeg",
];

function JournalPreview() {
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
        {MARKETING_PHOTOS.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt="" className="h-12 w-12 rounded object-cover" />
        ))}
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

function TreeAvatar({ initials, bg, color, size = 9 }: { initials: string; bg: string; color: string; size?: number }) {
  const px = size * 4;
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full font-semibold shadow-sm"
      style={{ width: px, height: px, backgroundColor: bg, color, fontSize: size < 8 ? 8 : 10 }}
    >
      {initials}
    </div>
  );
}

function TreePreview() {
  const LINE = "rgba(100,100,90,0.25)";
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-0 p-3 pt-4">

      {/* Generation label */}
      <span className="mb-2 rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider" style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", opacity: 0.85 }}>
        3 generations
      </span>

      {/* Grandparents */}
      <div className="flex items-center gap-0">
        <TreeAvatar initials="Gma" bg="#3d6b5e" color="#fff" size={9} />
        <div style={{ width: 20, height: 2, background: LINE }} />
        <TreeAvatar initials="Gpa" bg="#3d6b5e" color="#fff" size={9} />
      </div>

      {/* Stem down to parents */}
      <div style={{ width: 2, height: 14, background: LINE }} />

      {/* Parents */}
      <div className="flex items-center gap-0">
        <TreeAvatar initials="Mom" bg="#c47c3a" color="#fff" size={9} />
        <div className="flex items-center justify-center" style={{ width: 20, height: 2, background: LINE }}>
          <span style={{ fontSize: 8, lineHeight: 1, color: "#c47c3a", marginTop: -1 }}>♥</span>
        </div>
        <TreeAvatar initials="Dad" bg="#c47c3a" color="#fff" size={9} />
      </div>

      {/* Branch down to kids */}
      <div style={{ width: 2, height: 12, background: LINE }} />
      <div style={{ width: 80, height: 2, background: LINE }} />

      {/* Kids */}
      <div className="flex items-end gap-0">
        {[
          { initials: "Em", offset: 0 },
          { initials: "Jak", offset: 0 },
          { initials: "Sam", offset: 0 },
        ].map(({ initials }) => (
          <div key={initials} className="flex flex-col items-center">
            <div style={{ width: 2, height: 12, background: LINE }} />
            <TreeAvatar initials={initials} bg="var(--secondary)" color="var(--foreground)" size={8} />
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
    <div
      className="flex h-full w-full flex-col gap-2.5 p-4"
      style={{ background: "linear-gradient(160deg, #faf3e8 0%, #eddfc8 100%)" }}
    >
      {/* Header row: badge + big decorative quote */}
      <div className="flex items-start justify-between">
        <span
          className="rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: "rgba(196,124,58,0.18)", color: "#b86d2a" }}
        >
          Family Recipe
        </span>
        <span
          style={{
            fontSize: 32,
            lineHeight: 1,
            color: "rgba(180,120,60,0.22)",
            fontFamily: "Georgia, serif",
          }}
        >
          &ldquo;
        </span>
      </div>

      {/* Recipe name */}
      <p
        className="text-[13px] font-bold leading-tight"
        style={{ fontFamily: "var(--font-display-serif)", color: "#2d1a0a" }}
      >
        Nana&apos;s Banana Bread
      </p>

      {/* Italic quote */}
      <p className="text-[9px] italic leading-snug" style={{ color: "#7a5a38" }}>
        &ldquo;She always said the secret was one extra banana...&rdquo;
      </p>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(180,120,60,0.2)" }} />

      {/* Ingredient chips */}
      <div className="flex flex-wrap gap-1">
        {["🍌 3 bananas", "🧈 1/3 cup butter", "🍬 1 cup sugar"].map((item) => (
          <span
            key={item}
            className="rounded-full px-2 py-0.5 text-[8px]"
            style={{
              background: "rgba(255,255,255,0.7)",
              color: "#6b4422",
              border: "1px solid rgba(180,120,60,0.25)",
            }}
          >
            {item}
          </span>
        ))}
      </div>

      <span className="text-[8px]" style={{ color: "#9a7a58" }}>
        + 5 more ingredients
      </span>
    </div>
  );
}

/* ── Component ───────────────────────────────────────────────── */

export function FeaturesBento() {
  const features = [
    {
      icon: BookOpen,
      title: "Journal with Photos & Video",
      description:
        "Write about trips, milestones, and the everyday chaos. Attach photos and short videos of the gems, not everything.",
      Preview: JournalPreview,
    },
    {
      icon: MapPin,
      title: "Family Map",
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
              className="group overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
              }}
            >
              {/* Mini UI preview */}
              <div
                className="relative h-48 overflow-hidden transition-transform duration-500 group-hover:scale-[1.04]"
                style={{ backgroundColor: "var(--secondary)" }}
              >
                <feature.Preview />
              </div>
              <div className="p-6">
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
                  style={{ backgroundColor: "rgba(61,107,94,0.12)", border: "1px solid rgba(61,107,94,0.15)" }}
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
