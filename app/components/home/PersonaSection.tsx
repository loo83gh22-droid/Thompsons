import { Heart, Camera, Gift, Users } from "lucide-react";
import Link from "next/link";

const personas = [
  {
    icon: Heart,
    label: "For parents",
    headline: "They grow up faster than you think. Write it down.",
    description:
      "The funny things they say at dinner. The first time they did something brave. The stuff you swore you'd remember. You won't. But your nest will.",
    cta: { text: "Start Your Family Nest", href: "/login?mode=signup" },
  },
  {
    icon: Users,
    label: "For couples",
    headline: "Your story started before the kids.",
    description:
      "Document it like it matters. Because it does. Date nights, trips, inside jokes, the apartment before the house. All of it belongs somewhere.",
    cta: { text: "Start Your Family Nest", href: "/login?mode=signup" },
  },
  {
    icon: Camera,
    label: "For growing families",
    headline: "More people, more memories, one place.",
    description:
      "Everyone adds what they can, when they can. Nobody has to be the family archivist. The nest fills itself.",
    cta: { text: "Start Your Family Nest", href: "/login?mode=signup" },
  },
  {
    icon: Gift,
    label: "For gift-givers",
    headline: "Better than a candle. We're allowed to say that.",
    description:
      "Set up a Nest, add some photos, wrap the login on a card. One-time purchase. No subscription for them to manage. The Legacy plan is built for this.",
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
            Not social media. Not a photo dump. Just your family&apos;s stuff.
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
