import { Users, Heart, Globe, Star } from "lucide-react";

const stats = [
  { icon: Users, value: "10,000+", label: "Families trust us" },
  { icon: Heart, value: "50K+", label: "Memories saved" },
  { icon: Globe, value: "100+", label: "Countries" },
  { icon: Star, value: "4.9", label: "Star rating" },
];

export function TrustBar() {
  return (
    <section
      className="py-12"
      style={{
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--card)",
      }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-3 text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(61,107,94,0.1)" }}
              >
                <stat.icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <p
                  className="text-2xl md:text-3xl"
                  style={{
                    fontFamily: "var(--font-display-serif)",
                    color: "var(--foreground)",
                  }}
                >
                  {stat.value}
                </p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
