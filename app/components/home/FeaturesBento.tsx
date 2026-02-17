import { BookOpen, MapPin, GitBranch, Mic, Lock, UtensilsCrossed } from "lucide-react";

/* ── Mini UI previews for each feature card ──────────────────── */

function JournalPreview() {
  return (
    <div className="flex h-full w-full flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold" style={{ color: "var(--foreground)" }}>
          June 14, 2025
        </span>
        <span className="rounded-full px-1.5 py-0.5 text-[8px]" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
          New
        </span>
      </div>
      <p className="text-[11px] font-medium" style={{ color: "var(--foreground)" }}>
        Beach day with the whole crew
      </p>
      <div className="flex gap-1.5">
        <div className="h-10 w-10 rounded" style={{ background: "linear-gradient(135deg, hsl(200,60%,70%), hsl(200,50%,55%))" }} />
        <div className="h-10 w-10 rounded" style={{ background: "linear-gradient(135deg, hsl(35,60%,70%), hsl(35,50%,55%))" }} />
        <div className="h-10 w-10 rounded flex items-center justify-center" style={{ backgroundColor: "var(--border)" }}>
          <span className="text-[8px] font-semibold" style={{ color: "var(--muted)" }}>+4</span>
        </div>
      </div>
      <div className="mt-auto flex gap-1">
        <div className="h-1.5 rounded-full flex-[3]" style={{ backgroundColor: "var(--border)" }} />
        <div className="h-1.5 rounded-full flex-[2]" style={{ backgroundColor: "var(--border)" }} />
      </div>
    </div>
  );
}

function MapPreview() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Simplified map background */}
      <div className="absolute inset-0" style={{ backgroundColor: "hsl(120,15%,88%)" }}>
        {/* Map lines */}
        <div className="absolute top-[30%] left-0 right-0 h-px" style={{ backgroundColor: "hsl(120,10%,80%)" }} />
        <div className="absolute top-[55%] left-0 right-0 h-px" style={{ backgroundColor: "hsl(120,10%,80%)" }} />
        <div className="absolute top-0 bottom-0 left-[40%] w-px" style={{ backgroundColor: "hsl(120,10%,80%)" }} />
        <div className="absolute top-0 bottom-0 left-[70%] w-px" style={{ backgroundColor: "hsl(120,10%,80%)" }} />
      </div>
      {/* Pins */}
      {[
        { left: "25%", top: "28%", label: "Home" },
        { left: "55%", top: "40%", label: "Vacation" },
        { left: "72%", top: "22%", label: "Nana's" },
        { left: "38%", top: "65%", label: "Road trip" },
      ].map((pin) => (
        <div
          key={pin.label}
          className="absolute flex flex-col items-center"
          style={{ left: pin.left, top: pin.top, transform: "translate(-50%, -100%)" }}
        >
          <div className="rounded-full px-1.5 py-0.5 text-[7px] font-medium shadow-sm whitespace-nowrap" style={{ backgroundColor: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
            {pin.label}
          </div>
          <div className="h-3 w-3 rounded-full shadow-md" style={{ backgroundColor: "var(--accent)", border: "2px solid #fff" }} />
        </div>
      ))}
      <div className="absolute bottom-2 right-2 rounded px-1.5 py-0.5 text-[8px] font-medium" style={{ backgroundColor: "var(--card)", color: "var(--muted)", border: "1px solid var(--border)" }}>
        4 pins
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
