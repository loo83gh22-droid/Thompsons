import { Suspense } from "react";
import { BookOpen, MapPin, GitBranch, Mic, Lock, Baby } from "lucide-react";
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

// Fishing-specific photos for the Huck's 1st Catch card
const FISHING_PHOTOS = [
  "/marketing/social/family/fishing-kid-first-catch-1.jpeg",
  "/marketing/social/family/fishing-dad-son-boat-1.jpeg",
  "/marketing/social/family/fishing-kid-back-of-boat-1.jpeg",
];

function JournalPreview() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Hero photo — fills the whole preview area */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={FISHING_PHOTOS[0]} alt="" width={400} height={300} className="h-full w-full object-cover" />

      {/* Gradient overlay — fades bottom to dark so text reads clearly */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.22) 55%, transparent 100%)" }}
      />

      {/* "New" badge — top right */}
      <div className="absolute right-3 top-3">
        <span
          className="rounded-full px-2 py-0.5 text-[8px] font-semibold"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          New
        </span>
      </div>

      {/* Bottom: date · location, title, thumbnail strip */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.6)" }}>
          Feb 20, 2026 &middot; Costa Rica
        </p>
        <p
          className="mt-0.5 text-[13px] font-bold leading-tight"
          style={{ color: "#fff", fontFamily: "var(--font-display-serif)" }}
        >
          Huck&apos;s 1st Catch!
        </p>

        {/* Thumbnail strip */}
        <div className="mt-2 flex items-center gap-1">
          {FISHING_PHOTOS.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded object-cover"
              style={{ border: "1.5px solid rgba(255,255,255,0.5)" }}
            />
          ))}
          <div
            className="flex h-9 w-9 items-center justify-center rounded"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)" }}
          >
            <span className="text-[8px] font-bold" style={{ color: "#fff" }}>+3</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Pin colours by category
const PIN_BIRTHPLACE = "#e05c8a"; // warm pink
const PIN_VACATION   = "#d97706"; // amber
const PIN_HOME       = "#3d6b5e"; // forest green

const BENTO_MAP_PINS: WorldPin[] = [
  // ── Homes (4) ──────────────────────────────────────────────
  { lat: 43.65,  lng: -79.38,  color: PIN_HOME, r: 4   },  // Toronto
  { lat: 40.71,  lng: -74.01,  color: PIN_HOME, r: 4   },  // New York
  { lat: 34.05,  lng: -118.24, color: PIN_HOME, r: 4   },  // Los Angeles
  { lat: 39.74,  lng: -104.99, color: PIN_HOME, r: 4   },  // Denver

  // ── Birthplaces (7) ────────────────────────────────────────
  { lat: 45.50,  lng: -73.57,  color: PIN_BIRTHPLACE, r: 3 }, // Montreal
  { lat: 42.36,  lng: -71.06,  color: PIN_BIRTHPLACE, r: 3 }, // Boston
  { lat: 33.75,  lng: -84.39,  color: PIN_BIRTHPLACE, r: 3 }, // Atlanta
  { lat: 51.51,  lng:  -0.13,  color: PIN_BIRTHPLACE, r: 3 }, // London
  { lat: 41.39,  lng:   2.17,  color: PIN_BIRTHPLACE, r: 3 }, // Barcelona
  { lat: -33.87, lng: 151.21,  color: PIN_BIRTHPLACE, r: 3 }, // Sydney
  { lat: -22.91, lng: -43.17,  color: PIN_BIRTHPLACE, r: 3 }, // Rio de Janeiro

  // ── Vacations (12) ─────────────────────────────────────────
  { lat: 21.31,  lng: -157.86, color: PIN_VACATION, r: 2.5 }, // Honolulu
  { lat: 20.63,  lng: -87.08,  color: PIN_VACATION, r: 2.5 }, // Cancun
  { lat: 17.99,  lng: -66.61,  color: PIN_VACATION, r: 2.5 }, // Puerto Rico
  { lat: 25.04,  lng: -77.35,  color: PIN_VACATION, r: 2.5 }, // Nassau
  { lat: 41.90,  lng:  12.50,  color: PIN_VACATION, r: 2.5 }, // Rome
  { lat: 48.86,  lng:   2.35,  color: PIN_VACATION, r: 2.5 }, // Paris
  { lat: 38.72,  lng:  -9.14,  color: PIN_VACATION, r: 2.5 }, // Lisbon
  { lat: 36.43,  lng:  28.22,  color: PIN_VACATION, r: 2.5 }, // Rhodes
  { lat: 10.39,  lng: -75.51,  color: PIN_VACATION, r: 2.5 }, // Cartagena
  { lat: 35.68,  lng: 139.69,  color: PIN_VACATION, r: 2.5 }, // Tokyo
  { lat:  9.93,  lng: -84.08,  color: PIN_VACATION, r: 2.5 }, // Costa Rica
];

function MapPreview() {
  return (
    <Suspense
      fallback={
        <div className="h-full w-full" style={{ background: "#c8dff0" }} />
      }
    >
      <WorldMapSVG pins={BENTO_MAP_PINS} badge="22 pins · 4 homes · 7 birthplaces · 11 trips" />
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

const TREE_LINE = "rgba(100,100,90,0.22)";

// Mini card node matching the real family-tree card style
function TreeNode({
  initials,
  bg,
  label,
}: {
  initials: string;
  bg: string;
  label: string;
}) {
  return (
    <div
      className="flex flex-col items-center rounded-xl bg-white px-2 py-1.5 shadow-sm"
      style={{ border: `1.5px solid ${bg}55`, minWidth: 40 }}
    >
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full text-[8px] font-bold text-white"
        style={{ backgroundColor: bg }}
      >
        {initials}
      </div>
      <p
        className="mt-0.5 text-center text-[8px] font-semibold leading-tight"
        style={{ color: "#2a2a2a" }}
      >
        {label}
      </p>
    </div>
  );
}

function TreePreview() {
  const LINE = TREE_LINE;

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-0 px-2 py-3"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(0,0,0,0.09) 1px, transparent 1px)",
        backgroundSize: "12px 12px",
        backgroundColor: "#f8f6f0",
      }}
    >
      {/* 3 GENERATIONS chip */}
      <span
        className="mb-2.5 rounded-full px-2 py-0.5 text-[7px] font-semibold uppercase tracking-widest"
        style={{ backgroundColor: "#3d6b5e", color: "#fff", opacity: 0.9 }}
      >
        3 Generations
      </span>

      {/* Gen 0 — Grandparents */}
      <div className="flex items-center gap-0.5">
        <TreeNode initials="Gma" bg="#3d6b5e" label="Grandma" />
        <div style={{ width: 10, height: 2, background: LINE }} />
        <span style={{ fontSize: 9, color: "#c47c3a", lineHeight: 1 }}>♥</span>
        <div style={{ width: 10, height: 2, background: LINE }} />
        <TreeNode initials="Gpa" bg="#3d6b5e" label="Gramps" />
      </div>

      <div style={{ width: 2, height: 11, background: LINE }} />

      {/* Gen 1 — Parents */}
      <div className="flex items-center gap-0.5">
        <TreeNode initials="Mom" bg="#c47c3a" label="Mom" />
        <div style={{ width: 10, height: 2, background: LINE }} />
        <span style={{ fontSize: 9, color: "#c47c3a", lineHeight: 1 }}>♥</span>
        <div style={{ width: 10, height: 2, background: LINE }} />
        <TreeNode initials="Dad" bg="#c47c3a" label="Dad" />
      </div>

      {/* Branch to kids */}
      <div style={{ width: 2, height: 11, background: LINE }} />
      <div style={{ width: 80, height: 2, background: LINE }} />

      {/* Gen 2 — Kids */}
      <div className="flex items-start">
        {["Em", "Jak", "Sam"].map((n) => (
          <div
            key={n}
            className="flex flex-col items-center"
            style={{ margin: "0 5px" }}
          >
            <div style={{ width: 2, height: 10, background: LINE }} />
            <TreeNode initials={n} bg="#8ca89a" label={n} />
          </div>
        ))}
      </div>
    </div>
  );
}

function VoiceMemoPreview() {
  const memos = [
    {
      name: "Grandma's story",
      duration: "3:42",
      color: "#4d9e87",
      played: 11,
      bars: [2, 5, 8, 4, 9, 6, 3, 7, 5, 8, 4, 6, 7, 3, 8, 5, 4, 9, 6, 4],
    },
    {
      name: "First words",
      duration: "0:18",
      color: "#c47c3a",
      played: 5,
      bars: [3, 7, 5, 9, 4, 8, 6, 3, 7, 5, 4, 8, 6, 4, 7, 3, 5, 8, 4, 6],
    },
  ];

  return (
    <div
      className="flex h-full w-full flex-col justify-center gap-2.5 p-4"
      style={{ background: "linear-gradient(160deg, #1a2e24 0%, #0e1c14 100%)" }}
    >
      {memos.map((memo) => (
        <div
          key={memo.name}
          className="flex items-center gap-2.5 rounded-xl p-2.5"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
        >
          {/* Play button */}
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: memo.color }}
          >
            <span style={{ color: "#fff", fontSize: 8, paddingLeft: 1 }}>▶</span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold truncate" style={{ color: "#f0ebe3" }}>
              {memo.name}
            </p>
            {/* Waveform with played/unplayed distinction */}
            <div className="mt-1.5 flex items-end gap-[2px]">
              {memo.bars.map((h, i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: 2.5,
                    height: `${h}px`,
                    backgroundColor:
                      i < memo.played ? memo.color : "rgba(255,255,255,0.18)",
                  }}
                />
              ))}
            </div>
          </div>

          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, flexShrink: 0 }}>
            {memo.duration}
          </span>
        </div>
      ))}

      {/* Footer label */}
      <p
        className="mt-0.5 text-center text-[8px] font-medium uppercase tracking-wider"
        style={{ color: "rgba(255,255,255,0.22)" }}
      >
        2 recordings · family archive
      </p>
    </div>
  );
}

function TimeCapsulePreview() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center"
      style={{ background: "linear-gradient(160deg, #fdf6e3 0%, #eddfc8 100%)" }}
    >
      {/* Envelope with inline wax seal */}
      <div className="relative" style={{ marginBottom: 6 }}>
        <svg width="88" height="64" viewBox="0 0 80 58" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="1" y="1" width="78" height="56" rx="4" fill="#fef9ee" stroke="#c49a4a" strokeWidth="1.5" />
          <path d="M1 5L40 32L79 5" stroke="#c49a4a" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M1 57L28 35" stroke="#c49a4a" strokeWidth="1" strokeLinecap="round" opacity="0.35" />
          <path d="M79 57L52 35" stroke="#c49a4a" strokeWidth="1" strokeLinecap="round" opacity="0.35" />
        </svg>
        {/* Wax seal */}
        <div style={{ position: "absolute", bottom: -14, left: "50%", transform: "translateX(-50%)" }}>
          <svg width="32" height="32" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <radialGradient id="tc-wax" cx="38%" cy="32%" r="55%">
                <stop offset="0%" stopColor="#f87171" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="28" cy="28" r="27" fill="#b91c1c" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const r = 25 + (i % 3 === 0 ? 3.5 : i % 2 === 0 ? 2 : 1.5);
              return (
                <circle
                  key={angle}
                  cx={28 + r * Math.cos(rad)}
                  cy={28 + r * Math.sin(rad)}
                  r={3 + (i % 2) * 1.5}
                  fill="#b91c1c"
                />
              );
            })}
            <circle cx="28" cy="28" r="22" fill="#dc2626" />
            <circle cx="28" cy="28" r="22" fill="url(#tc-wax)" />
            <circle cx="28" cy="28" r="17" fill="none" stroke="#991b1b" strokeWidth="1.2" strokeDasharray="2 2" />
            <text x="28" y="33" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="13" fill="#fff" style={{ letterSpacing: "0.05em" }}>ML</text>
          </svg>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <p className="text-[12px] font-bold leading-tight" style={{ color: "#3d2800", fontFamily: "var(--font-display-serif)" }}>
          Letter to future Emma
        </p>
        <p className="mt-0.5 text-[9px]" style={{ color: "#9a7040" }}>
          from Mom · sealed with love
        </p>
      </div>
      <div
        className="rounded-full px-2.5 py-1 text-[9px] font-medium"
        style={{ backgroundColor: "rgba(255,255,255,0.75)", color: "#b86d2a", border: "1px solid rgba(196,124,58,0.35)" }}
      >
        🔒 Opens Dec 25, 2030
      </div>
    </div>
  );
}

function BabyBookPreview() {
  const years = [
    { year: 2022, label: "Newborn", photos: 5 },
    { year: 2023, label: "1 year", photos: 5 },
    { year: 2024, label: "2 years", photos: 3 },
    { year: 2025, label: "3 years", photos: 1 },
  ];
  return (
    <div
      className="flex h-full w-full flex-col gap-1 px-4 py-3"
      style={{ background: "linear-gradient(160deg, #faf3e8 0%, #eddfc8 100%)" }}
    >
      <span
        className="mb-1 self-start rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider"
        style={{ backgroundColor: "rgba(196,124,58,0.18)", color: "#b86d2a" }}
      >
        Through the Years
      </span>
      <div className="relative flex flex-1 flex-col justify-center gap-2.5 pl-4">
        {/* Timeline line */}
        <div className="absolute left-[5px] top-1 bottom-1 w-px" style={{ backgroundColor: "rgba(180,120,60,0.3)" }} />
        {years.map((y) => (
          <div key={y.year} className="relative flex items-center gap-2.5">
            {/* Dot */}
            <div
              className="absolute left-[-13px] h-[9px] w-[9px] rounded-full border-[1.5px]"
              style={{ borderColor: "#b86d2a", backgroundColor: y.photos === 5 ? "#b86d2a" : "#faf3e8" }}
            />
            {/* Year label */}
            <span className="w-8 text-[9px] font-bold" style={{ color: "#2d1a0a" }}>{y.year}</span>
            {/* Photo circles */}
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 w-4 rounded-sm"
                  style={{
                    backgroundColor: i < y.photos ? "rgba(180,120,60,0.25)" : "rgba(180,120,60,0.08)",
                    border: i < y.photos ? "1px solid rgba(180,120,60,0.4)" : "1px dashed rgba(180,120,60,0.2)",
                  }}
                />
              ))}
            </div>
            {/* Age */}
            <span className="text-[8px]" style={{ color: "#9a7a58" }}>{y.label}</span>
          </div>
        ))}
      </div>
      <span className="text-center text-[8px] font-medium" style={{ color: "#9a7a58" }}>
        4 years of memories
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
        "Map your whole crew. Every member gets a profile with photos, birthdays, and their place in the family story.",
      Preview: TreePreview,
    },
    {
      icon: Mic,
      title: "Voice Memos",
      description:
        "Mom singing bedtime songs. The kids' favourite sayings before they outgrow them. Voices you will want to hear again someday.",
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
      icon: Baby,
      title: "Baby Book",
      description:
        "Five photos per year, every year. Watch your kids grow up in a timeline you'll never stop scrolling.",
      Preview: BabyBookPreview,
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
