import { BookOpen, MapPin, GitBranch, Mic, Lock, UtensilsCrossed } from "lucide-react";

/* ── Mini UI previews for each feature card ──────────────────── */

function JournalPreview() {
  // IMPORTANT: Only Thompson family photos may be used here (owner-approved for marketing).
  // Never replace these with photos from any other user or family.
  const photos = [
    "https://tstbngohenxrbqroejth.supabase.co/storage/v1/object/public/journal-photos/69a1b499-0026-46f9-9c77-04fcafcb8538/d372f50b-bd74-4cdb-b93f-edda628a7c6b.jpeg",
    "https://tstbngohenxrbqroejth.supabase.co/storage/v1/object/public/journal-photos/69a1b499-0026-46f9-9c77-04fcafcb8538/d1036ff2-19f9-4a97-98c3-0d0f3f339260.jpeg",
    "https://tstbngohenxrbqroejth.supabase.co/storage/v1/object/public/journal-photos/69a1b499-0026-46f9-9c77-04fcafcb8538/b59ba60b-8f32-40d6-a8ec-ffff5d505f05.jpeg",
  ];

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
        {photos.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={url} alt="" className="h-12 w-12 rounded object-cover" />
        ))}
        <div className="h-12 w-12 rounded flex items-center justify-center" style={{ backgroundColor: "var(--border)" }}>
          <span className="text-[8px] font-semibold" style={{ color: "var(--muted)" }}>+3</span>
        </div>
      </div>
    </div>
  );
}

function MapPreview() {
  // Positions in SVG viewBox 0 0 360 180 (lon+180, 90-lat)
  const pins = [
    { cx: 100.6, cy: 46.4 }, // Toronto
    { cx: 106.0, cy: 49.3 }, // New York
    { cx: 113.4, cy: 72.0 }, // Puerto Rico
    { cx: 170.9, cy: 51.3 }, // Lisbon
    { cx: 252.9, cy: 70.9 }, // Mumbai
    { cx: 331.2, cy: 123.9 }, // Sydney
  ];

  return (
    <div className="relative h-full w-full overflow-hidden">
      <svg
        viewBox="0 0 360 180"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Ocean */}
        <rect width="360" height="180" fill="#cde5f2" />

        {/* Grid lines */}
        <line x1="0" y1="60" x2="360" y2="60" stroke="#9ec5db" strokeWidth="0.4" strokeDasharray="5,5" />
        <line x1="0" y1="90" x2="360" y2="90" stroke="#9ec5db" strokeWidth="0.6" />
        <line x1="0" y1="120" x2="360" y2="120" stroke="#9ec5db" strokeWidth="0.4" strokeDasharray="5,5" />
        <line x1="90" y1="0" x2="90" y2="180" stroke="#9ec5db" strokeWidth="0.4" strokeDasharray="5,5" />
        <line x1="180" y1="0" x2="180" y2="180" stroke="#9ec5db" strokeWidth="0.6" />
        <line x1="270" y1="0" x2="270" y2="180" stroke="#9ec5db" strokeWidth="0.4" strokeDasharray="5,5" />

        {/* North America */}
        <path d="M55,16 L102,12 L135,18 L150,28 L158,46 L150,62 L140,76 L118,80 L100,92 L84,100 L70,82 L56,60 L48,38 Z" fill="#b6ccaf" stroke="#9db895" strokeWidth="0.5" />
        {/* Greenland */}
        <path d="M118,5 L140,4 L148,12 L138,20 L120,18 Z" fill="#b6ccaf" stroke="#9db895" strokeWidth="0.5" />
        {/* South America */}
        <path d="M96,96 L128,90 L148,102 L150,125 L140,152 L118,166 L98,156 L88,132 L90,108 Z" fill="#b6ccaf" stroke="#9db895" strokeWidth="0.5" />
        {/* Europe */}
        <path d="M160,17 L196,14 L202,26 L194,38 L175,42 L162,36 L156,25 Z" fill="#b6ccaf" stroke="#9db895" strokeWidth="0.5" />
        {/* Africa */}
        <path d="M155,44 L200,38 L218,62 L212,108 L192,150 L168,160 L148,135 L144,82 L150,55 Z" fill="#b6ccaf" stroke="#9db895" strokeWidth="0.5" />
        {/* Asia */}
        <path d="M198,10 L296,7 L338,18 L342,46 L312,66 L272,76 L232,74 L208,64 L196,48 L194,26 Z" fill="#b6ccaf" stroke="#9db895" strokeWidth="0.5" />
        {/* Japan */}
        <path d="M315,30 L322,28 L324,38 L317,40 Z" fill="#b6ccaf" stroke="#9db895" strokeWidth="0.5" />
        {/* Australia */}
        <path d="M272,108 L322,104 L340,118 L334,148 L305,155 L276,142 L266,124 Z" fill="#b6ccaf" stroke="#9db895" strokeWidth="0.5" />
        {/* New Zealand */}
        <path d="M346,135 L352,130 L354,142 L348,146 Z" fill="#b6ccaf" stroke="#9db895" strokeWidth="0.5" />

        {/* Pins */}
        {pins.map((pin, i) => (
          <g key={i}>
            <circle cx={pin.cx} cy={pin.cy} r="5" fill="#d97706" opacity="0.9" />
            <circle cx={pin.cx} cy={pin.cy} r="2.2" fill="white" />
          </g>
        ))}
      </svg>

      <div
        className="absolute bottom-2 right-2 rounded-lg px-1.5 py-0.5 text-[8px] font-medium"
        style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "var(--foreground)", border: "1px solid var(--border)" }}
      >
        6 pins · worldwide
      </div>
    </div>
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

/* ── Feature data ────────────────────────────────────────────── */

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

/* ── Component ───────────────────────────────────────────────── */

export function FeaturesBento() {
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
