import { Settings2, ToggleRight, ToggleLeft } from "lucide-react";

/* Two groups: memory/storytelling features and activity/adventure features */
const memoryFeatures = [
  { icon: "\u{1F4D6}", name: "Stories", active: true },
  { icon: "\u{1F373}", name: "Recipes", active: true },
  { icon: "\u{1F3A4}", name: "Voice Memos", active: true },
  { icon: "\u{1F3A8}", name: "Artwork", active: false },
  { icon: "\u{1F3C6}", name: "Trophy Case", active: true },
  { icon: "\u{270D}\u{FE0F}", name: "One Line A Day", active: false },
];

const activityFeatures = [
  { icon: "\u{26BE}", name: "MLB Stadium Tour", active: true },
  { icon: "\u{1F3D5}\u{FE0F}", name: "National Parks", active: true },
  { icon: "\u{1F3B5}", name: "Concert Map", active: true },
  { icon: "\u{1F31F}", name: "Bucket List", active: false },
  { icon: "\u{1F3A3}", name: "Fishing Map", active: false },
  { icon: "\u{2764}\u{FE0F}", name: "Favourites", active: true },
];

function FeatureTile({ f }: { f: { icon: string; name: string; active: boolean } }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all ${
        f.active ? "shadow-sm" : "opacity-40"
      }`}
      style={{
        backgroundColor: f.active ? "var(--surface)" : "var(--background)",
        border: f.active ? "1px solid var(--accent)" : "1px solid var(--border)",
      }}
    >
      <span className={`text-lg ${f.active ? "" : "grayscale"}`}>
        {f.icon}
      </span>
      <p
        className="min-w-0 flex-1 truncate text-sm font-medium"
        style={{ color: f.active ? "var(--foreground)" : "var(--muted)" }}
      >
        {f.name}
      </p>
      {f.active ? (
        <ToggleRight className="h-5 w-5 shrink-0" style={{ color: "var(--accent)" }} />
      ) : (
        <ToggleLeft className="h-5 w-5 shrink-0" style={{ color: "var(--border)" }} />
      )}
    </div>
  );
}

export function MakeItYours() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
              <Settings2 className="h-4 w-4" style={{ color: "var(--primary)" }} />
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--primary)" }}>
                Fully Customizable
              </span>
            </div>

            <h2
              className="mb-6 text-3xl font-bold md:text-4xl"
              style={{
                fontFamily: "var(--font-display-serif)",
                color: "var(--foreground)",
                textWrap: "balance",
              }}
            >
              No two families are the same. Neither are their Nests.
            </h2>

            <div className="flex flex-col gap-5 text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
              <p>
                Every feature in your Nest can be toggled on or off. Your family
                writes stories and saves recipes but doesn&apos;t care about artwork?
                Toggle it off. Your kids are obsessed with baseball? Turn on the
                Stadium Tour. You&apos;re mapping every concert you&apos;ve ever been to?
                There&apos;s a feature for that too.
              </p>
              <p>
                These are just a few. We&apos;re always adding more, and your Nest
                grows with you. What you see here is what one family chose. Yours
                will look completely different.
              </p>
              <p style={{ color: "var(--foreground)", fontWeight: 500 }}>
                Your Nest only shows what you&apos;ve chosen. Nothing extra. Nothing in the way.
              </p>
            </div>
          </div>

          {/* Visual — two-column toggle catalog */}
          <div className="flex flex-col gap-4">
            {/* Memory features group */}
            <div>
              <p
                className="mb-2 text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--accent)" }}
              >
                Memories &amp; Stories
              </p>
              <div className="grid grid-cols-2 gap-2">
                {memoryFeatures.map((f) => (
                  <FeatureTile key={f.name} f={f} />
                ))}
              </div>
            </div>

            {/* Activity features group */}
            <div>
              <p
                className="mb-2 text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--accent)" }}
              >
                Adventures &amp; Activities
              </p>
              <div className="grid grid-cols-2 gap-2">
                {activityFeatures.map((f) => (
                  <FeatureTile key={f.name} f={f} />
                ))}
              </div>
            </div>

            {/* "And more" hint */}
            <p
              className="text-center text-xs"
              style={{ color: "var(--muted)" }}
            >
              + Traditions, Emergency Info, Reunion Planner, and more on the way
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
