import { ShieldCheck, Infinity, Users, Heart, Lock, Shield, Database, Globe, EyeOff, Ban } from "lucide-react";

const trustBadges = [
  { icon: Lock, label: "Bank-level encryption" },
  { icon: Shield, label: "Privacy-first design" },
  { icon: Database, label: "Your data, always yours" },
  { icon: Globe, label: "Encrypted at rest and in transit" },
];

const differentiators = [
  { icon: Ban, label: "We don't show ads. Ever. Not even tasteful ones." },
  { icon: EyeOff, label: "We don't sell your data. We don't 'anonymize' it and sell it. We don't even look at it. It's yours. We're serious." },
  { icon: ShieldCheck, label: "No algorithm deciding which grandchild you see more of." },
  { icon: Infinity, label: "Permanent, not disappearing stories" },
  { icon: Users, label: "Multi-generational. Designed to be passed down." },
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
            Our Story
          </p>
          <h2
            className="mb-8 text-3xl md:text-4xl lg:text-5xl"
            style={{
              fontFamily: "var(--font-display-serif)",
              color: "var(--primary-foreground)",
              textWrap: "balance",
            }}
          >
            Built for my own family first. Opened for yours.
          </h2>

          <div
            className="mb-12 flex flex-col gap-6 text-lg leading-relaxed"
            style={{ color: "var(--primary-foreground)", opacity: 0.8 }}
          >
            <p>
              I never kept a journal. Too clunky, no pictures, and the second
              you miss a week it starts to feel like homework.
            </p>
            <p>
              But I wanted to remember things. My wife sings a song to our boys
              every night before bed. My grandfather recorded himself reading
              The Night Before Christmas every single year. My step dad left
              voicemails I still go back and listen to. My dad and I have been
              chasing MLB stadiums together for years. I always wanted a map of
              everywhere our family has ever lived, traveled, or called home.
            </p>
            <p>
              None of it had a place to live. Group chats bury everything.
              Facebook isn&apos;t private. Apple Maps connects your photos to a
              map but your whole family can&apos;t build it together. A poster
              on the wall is great until you want to share it.
            </p>
            <p>
              So I started building something. First as a family gift. Then I
              realized other families probably wanted the same thing.
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
              One private place for the journals, photos, voice memos, maps,
              recipes, and stories that would otherwise disappear. No ads. No
              algorithm. Just your family.
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
            matters most. The rest can come over time.
          </p>
        </div>
      </div>
    </section>
  );
}
