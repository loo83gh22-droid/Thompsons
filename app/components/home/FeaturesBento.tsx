import { BookOpen, MapPin, GitBranch, Mic, Lock, UtensilsCrossed } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Journal with Photos & Video",
    description:
      "Write about trips, milestones, and everyday moments. Attach photos and short videos — the gems, not everything.",
  },
  {
    icon: MapPin,
    title: "Family Travel Map",
    description:
      "Pin everywhere your family has been. Vacations, homes, birthplaces — watch your map fill up over the years.",
  },
  {
    icon: GitBranch,
    title: "Family Tree",
    description:
      "Map your family. Every member gets a profile with photos, birthdays, and their role in the family story.",
  },
  {
    icon: Mic,
    title: "Voice Memos",
    description:
      "Record grandma's stories, a child's first words, or a bedtime tradition. Voices fade — these won't.",
  },
  {
    icon: Lock,
    title: "Time Capsules",
    description:
      "Write a letter to your future self — or your kids. Seal it and set an unlock date.",
  },
  {
    icon: UtensilsCrossed,
    title: "Stories & Recipes",
    description:
      "Capture family stories that would otherwise only live in someone's memory. Save grandma's recipes with the story behind them.",
  },
];

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
            Everything your family needs
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
            Built for real families — not influencers. Every feature exists because a family asked
            for it.
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
              {/* Image placeholder */}
              <div
                className="relative h-48 overflow-hidden"
                style={{ backgroundColor: "var(--secondary)" }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <feature.icon
                    className="h-12 w-12 transition-transform duration-500 group-hover:scale-110"
                    style={{ color: "var(--primary)", opacity: 0.3 }}
                  />
                </div>
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
