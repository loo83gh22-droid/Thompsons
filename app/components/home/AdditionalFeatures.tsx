import {
  Users,
  MessageCircle,
  Trophy,
  Star,
  Gift,
  Search,
  Link2,
  Smile,
  Music,
  Smartphone,
} from "lucide-react";

const additionalFeatures = [
  { label: "Multi-Family Support", icon: Users },
  { label: "Family Messages", icon: MessageCircle },
  { label: "Sports & Activities", icon: Trophy },
  { label: "Family Traditions", icon: Star },
  { label: "Birthday Reminders", icon: Gift },
  { label: "Global Search", icon: Search },
  { label: "Shareable Links", icon: Link2 },
  { label: "Kid Accounts", icon: Smile },
  { label: "Family Spotify", icon: Music },
  { label: "Works on Any Device — iOS, Android & Web", icon: Smartphone },
];

export function AdditionalFeatures() {
  return (
    <section className="pb-20 md:pb-32">
      <div className="mx-auto max-w-6xl px-6">
        <div
          className="rounded-2xl p-8 text-center md:p-12"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--card)",
          }}
        >
          <p
            className="mb-3 text-sm font-medium uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            And so much more
          </p>
          <h3
            className="mb-3 text-2xl md:text-3xl"
            style={{
              fontFamily: "var(--font-display-serif)",
              color: "var(--foreground)",
            }}
          >
            Plus all the little things that make it feel like home
          </h3>
          <p className="mb-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            From birthday reminders to a family playlist — every detail is here because a real family asked for it.
          </p>
          <p className="mb-8 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Family Nest is mobile-first and works in any browser. Add it to your home screen like an app — no App Store required.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {additionalFeatures.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-normal"
                style={{
                  backgroundColor: "var(--secondary)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--primary)" }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
