import { ShieldCheck, Infinity, Users, Heart, Lock, Shield, Database, Globe } from "lucide-react";

const trustBadges = [
  { icon: Lock, label: "Bank-level encryption" },
  { icon: Shield, label: "Privacy-first design" },
  { icon: Database, label: "Your data, always yours" },
  { icon: Globe, label: "US-based secure servers" },
];

const differentiators = [
  { icon: ShieldCheck, label: "Private, not public social media" },
  { icon: Infinity, label: "Permanent, not disappearing stories" },
  { icon: Users, label: "Multi-generational. Designed to be passed down." },
  { icon: Heart, label: "Ad-free. No strangers' content, just your family." },
];

export function EmotionalSection() {
  return (
    <section id="story" className="py-20 md:py-32" style={{ backgroundColor: "var(--primary)" }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl">
          <p
            className="mb-3 text-sm font-medium uppercase tracking-widest"
            style={{ color: "var(--primary-foreground)", opacity: 0.6 }}
          >
            Why Family Nest
          </p>
          <h2
            className="mb-8 text-3xl md:text-4xl lg:text-5xl"
            style={{
              fontFamily: "var(--font-display-serif)",
              color: "var(--primary-foreground)",
              textWrap: "balance",
            }}
          >
            More than a photo dump. A family heirloom.
          </h2>

          <div
            className="mb-12 flex flex-col gap-6 text-lg leading-relaxed"
            style={{ color: "var(--primary-foreground)", opacity: 0.8 }}
          >
            <p>
              Right now, your family&apos;s moments are scattered across Instagram, iCloud,
              WhatsApp, and a dozen other apps. Half your relatives never see any of it. The
              other half scrolls right past it between ads and strangers&apos; content.
            </p>
            <p>
              Family Nest brings it all together. It&apos;s private, it&apos;s permanent,
              and everyone in the family can jump in. Parents, grandparents, aunts, uncles,
              teens, and yes, even the little ones.
            </p>
            <p>
              And one day, you hand it over. It becomes something better than stuff.{" "}
              <span
                style={{
                  fontFamily: "var(--font-display-serif)",
                  fontStyle: "italic",
                  color: "var(--primary-foreground)",
                  opacity: 1,
                }}
              >
                The story of where they came from.
              </span>
            </p>
          </div>

          {/* Comparison differentiator */}
          <div
            className="mb-12 rounded-xl px-6 py-5"
            style={{ backgroundColor: "rgba(240,235,225,0.1)" }}
          >
            <p
              className="text-center text-sm leading-relaxed"
              style={{ color: "var(--primary-foreground)", opacity: 0.9 }}
            >
              Unlike a group chat, nothing gets buried. Unlike a photo album,
              everyone can contribute. Unlike social media, it&apos;s actually
              private.
            </p>
          </div>

          {/* Trust Badges */}
          <div className="mb-8 flex flex-wrap justify-center gap-6">
            {trustBadges.map((badge) => (
              <div key={badge.label} className="flex items-center gap-2">
                <badge.icon
                  className="h-4 w-4"
                  style={{ color: "var(--primary-foreground)", opacity: 0.7 }}
                />
                <span
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: "var(--primary-foreground)", opacity: 0.8 }}
                >
                  {badge.label}
                </span>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {differentiators.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl px-5 py-4"
                style={{ backgroundColor: "rgba(240,235,225,0.1)" }}
              >
                <item.icon
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--primary-foreground)", opacity: 0.7 }}
                />
                <p
                  className="text-sm"
                  style={{ color: "var(--primary-foreground)", opacity: 0.9 }}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <p
            className="mt-8 text-center text-sm"
            style={{ color: "var(--primary-foreground)", opacity: 0.6 }}
          >
            You don&apos;t have to move everything at once. Start with what
            matters most — the rest can come over time.
          </p>
        </div>
      </div>
    </section>
  );
}
