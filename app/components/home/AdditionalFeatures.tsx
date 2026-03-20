import {
  Users,
  Gift,
  Search,
  Smile,
  BookOpen,
  Camera,
  Home,
} from "lucide-react";

const additionalFeatures = [
  { label: "Multi-Family Support", icon: Users },
  { label: "Kid Accounts", icon: Smile },
  { label: "Birthday Reminders", icon: Gift },
  { label: "Global Search", icon: Search },
];

function MobilePhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 200 }}>
      {/* Phone frame */}
      <div
        className="relative overflow-hidden rounded-[32px] shadow-2xl"
        style={{
          width: 200,
          height: 380,
          border: "6px solid var(--foreground)",
          backgroundColor: "var(--background)",
        }}
      >
        {/* Status bar */}
        <div
          className="flex items-center justify-between px-4 pt-2 pb-1"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <span className="text-[8px] font-semibold" style={{ color: "var(--muted)" }}>9:41</span>
          <div
            className="rounded-full"
            style={{ width: 40, height: 8, backgroundColor: "var(--foreground)", opacity: 0.8 }}
          />
          <span className="text-[8px] font-semibold" style={{ color: "var(--muted)" }}>100%</span>
        </div>

        {/* Content area */}
        <div className="flex flex-col gap-2 px-3 pt-2" style={{ flex: 1 }}>
          {/* Page title */}
          <p
            className="text-[11px] font-bold"
            style={{ fontFamily: "var(--font-display-serif)", color: "var(--foreground)" }}
          >
            The Thompsons
          </p>

          {/* Stats row */}
          <div className="flex gap-1.5">
            {[
              { n: "12", l: "entries" },
              { n: "4", l: "members" },
              { n: "38", l: "photos" },
            ].map((s) => (
              <div
                key={s.l}
                className="flex-1 rounded-lg py-1.5 text-center"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <p className="text-[10px] font-bold" style={{ color: "var(--accent)" }}>{s.n}</p>
                <p className="text-[7px]" style={{ color: "var(--muted)" }}>{s.l}</p>
              </div>
            ))}
          </div>

          {/* Journal entry cards */}
          {[
            { title: "Beach day", date: "June 14", hasPhoto: true },
            { title: "Grandma's birthday", date: "June 8", hasPhoto: false },
            { title: "Summer break!", date: "June 1", hasPhoto: true },
          ].map((entry) => (
            <div
              key={entry.title}
              className="flex items-center gap-2 rounded-xl p-2"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px]"
                style={{ backgroundColor: entry.hasPhoto ? "var(--accent)" : "var(--surface)" }}
              >
                {entry.hasPhoto ? "📸" : "📔"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[9px] font-semibold" style={{ color: "var(--foreground)" }}>
                  {entry.title}
                </p>
                <p className="text-[8px]" style={{ color: "var(--muted)" }}>{entry.date}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom nav bar */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-2 pt-2 pb-3"
          style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--background)" }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <Home className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
            <span className="text-[6px]" style={{ color: "var(--accent)" }}>Home</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <BookOpen className="h-3.5 w-3.5" style={{ color: "var(--muted)" }} />
            <span className="text-[6px]" style={{ color: "var(--muted)" }}>Journal</span>
          </div>
          {/* FAB */}
          <div
            className="flex h-8 w-8 -translate-y-3 items-center justify-center rounded-full shadow-lg"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <span className="text-[10px] font-bold text-white">+</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Camera className="h-3.5 w-3.5" style={{ color: "var(--muted)" }} />
            <span className="text-[6px]" style={{ color: "var(--muted)" }}>Photos</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex flex-col gap-0.5">
              <div className="h-0.5 w-3 rounded-full" style={{ backgroundColor: "var(--muted)" }} />
              <div className="h-0.5 w-3 rounded-full" style={{ backgroundColor: "var(--muted)" }} />
              <div className="h-0.5 w-3 rounded-full" style={{ backgroundColor: "var(--muted)" }} />
            </div>
            <span className="text-[6px]" style={{ color: "var(--muted)" }}>More</span>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div
        className="absolute -right-6 top-16 rounded-xl px-2.5 py-1.5 shadow-lg"
        style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
      >
        <p className="text-[9px] font-medium opacity-75">Works on</p>
        <p className="text-[10px] font-bold">any device</p>
      </div>
    </div>
  );
}

export function AdditionalFeatures() {
  return (
    <section className="pb-20 md:pb-32">
      <div className="mx-auto max-w-6xl px-6">
        <div
          className="grid items-center gap-10 rounded-2xl p-8 md:grid-cols-2 md:p-12"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--card)",
          }}
        >
          {/* Left: text + feature chips */}
          <div>
            <p
              className="mb-3 text-sm font-medium uppercase tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              Built for real families
            </p>
            <h3
              className="mb-3 text-2xl md:text-3xl"
              style={{
                fontFamily: "var(--font-display-serif)",
                color: "var(--foreground)",
              }}
            >
              Feels like an app. No install required.
            </h3>
            <p className="mb-8 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              Family Nest is mobile-first and works in any browser. Add it to your home screen. Grandparents included.
            </p>
            <div className="flex flex-wrap gap-3">
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

          {/* Right: phone mockup */}
          <div className="flex justify-center">
            <MobilePhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
