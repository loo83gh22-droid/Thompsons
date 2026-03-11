import { Heart, Camera, Gift, Users } from "lucide-react";
import Link from "next/link";

const personas = [
  {
    icon: Users,
    label: "For couples",
    headline: "Your private story, not a public highlight reel",
    description:
      "Document date nights, trips, inside jokes, and the little moments that make you you. Build a shared recipe book. Seal time capsules for your anniversary. When your family grows, everything\u2019s already here.",
    cta: { text: "Start free", href: "/login?mode=signup" },
  },
  {
    icon: Heart,
    label: "For grandparents",
    headline: "See your grandkids without social media",
    description:
      "Big buttons, no confusing feeds, and a morning coffee ritual you\u2019ll look forward to. If you can check email, you can use the Nest.",
    cta: { text: "Start free", href: "/login?mode=signup" },
  },
  {
    icon: Camera,
    label: "For parents",
    headline: "Stop being the family archivist",
    description:
      "Everyone contributes on their own terms \u2014 Dad posts from the fishing trip, the kids add a silly video, Grandma shares her recipes.",
    cta: { text: "Start free", href: "/login?mode=signup" },
  },
  {
    icon: Gift,
    label: "For gift\u2011givers",
    headline: "Give something they\u2019ll keep forever",
    description:
      "Set up a Nest, upload some family photos, wrap the login on a card. One-time purchase. No subscription for them to manage.",
    cta: { text: "See the gift plan", href: "/gift" },
  },
];

export function PersonaSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p
            className="mb-3 text-sm font-medium uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            Who it&apos;s for
          </p>
          <h2
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{
              fontFamily: "var(--font-display-serif)",
              color: "var(--foreground)",
              textWrap: "balance",
            }}
          >
            Built for real families, not influencers
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {personas.map((persona) => (
            <div
              key={persona.label}
              className="flex flex-col rounded-2xl border p-8"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <div
                className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "rgba(61,107,94,0.1)" }}
              >
                <persona.icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
              </div>
              <p
                className="mb-1 text-xs font-medium uppercase tracking-widest"
                style={{ color: "var(--accent)" }}
              >
                {persona.label}
              </p>
              <h3
                className="mb-3 text-xl"
                style={{
                  fontFamily: "var(--font-display-serif)",
                  color: "var(--foreground)",
                }}
              >
                {persona.headline}
              </h3>
              <p
                className="mb-6 flex-1 text-sm leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                {persona.description}
              </p>
              <Link
                href={persona.cta.href}
                className="text-sm font-semibold transition-colors"
                style={{ color: "var(--primary)" }}
              >
                {persona.cta.text} &rarr;
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
