import { ShieldCheck, Infinity, Users, Heart } from "lucide-react";

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
            Why Our Family Nest
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
              Our Family Nest brings it all together. It&apos;s private, it&apos;s permanent,
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
        </div>
      </div>
    </section>
  );
}
