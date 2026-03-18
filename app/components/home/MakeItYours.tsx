import { Settings2 } from "lucide-react";

const sampleFeatures = [
  { icon: "\u{26BE}", name: "MLB Stadium Tour", active: true },
  { icon: "\u{1F3D5}\u{FE0F}", name: "National Parks", active: true },
  { icon: "\u{1F3A3}", name: "Fishing Map", active: false },
  { icon: "\u{2708}\u{FE0F}", name: "Trip Planner", active: true },
  { icon: "\u{1F31F}", name: "Bucket List", active: true },
  { icon: "\u{1F381}", name: "Gift Exchange", active: false },
  { icon: "\u{2764}\u{FE0F}", name: "Favourites", active: true },
  { icon: "\u{1F56F}\u{FE0F}", name: "Traditions", active: false },
  { icon: "\u{1F3E5}", name: "Emergency Info", active: true },
  { icon: "\u{1F389}", name: "Reunion Planner", active: false },
];

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
                Customizable
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
              Make it yours. Skip the rest.
            </h2>

            <div className="flex flex-col gap-5 text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
              <p>
                Not every family needs a fishing map. Not every family is tracking
                national parks. But some families are, and they shouldn&apos;t have
                to use three different apps to do it.
              </p>
              <p>
                Pick the features that fit how your family actually lives. Your kids
                are into baseball? Add the Stadium Tour. You&apos;re a camping
                family? Add National Parks. Just want a journal and some recipes?
                That&apos;s perfect too.
              </p>
              <p style={{ color: "var(--foreground)", fontWeight: 500 }}>
                Your Nest only shows what you&apos;ve chosen. Nothing extra. Nothing
                in the way.
              </p>
            </div>
          </div>

          {/* Visual — mock feature catalog tiles */}
          <div className="grid grid-cols-2 gap-3">
            {sampleFeatures.map((f) => (
              <div
                key={f.name}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all ${
                  f.active ? "shadow-sm" : "opacity-40"
                }`}
                style={{
                  backgroundColor: f.active ? "var(--surface)" : "var(--background)",
                  border: f.active
                    ? "1px solid var(--accent)"
                    : "1px solid var(--border)",
                }}
              >
                <span className={`text-xl ${f.active ? "" : "grayscale"}`}>
                  {f.icon}
                </span>
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: f.active ? "var(--foreground)" : "var(--muted)" }}
                  >
                    {f.name}
                  </p>
                  <p className="text-[10px]" style={{ color: f.active ? "var(--accent)" : "var(--muted)" }}>
                    {f.active ? "Added" : "Not added"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
