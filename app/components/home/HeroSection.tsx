import Link from "next/link";
import { ArrowRight, Gift, BookOpen, MapPin, Camera, Mic, Users, Shield, ChevronDown } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden w-full">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text Content */}
          <div className="flex flex-col gap-8 min-w-0">
            <div className="flex flex-col gap-6">
              <h1
                className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
                style={{
                  fontFamily: "var(--font-display-serif)",
                  color: "var(--foreground)",
                  textWrap: "balance",
                }}
              >
                Your family&apos;s story deserves better than a camera roll.
              </h1>
              <p
                className="max-w-lg text-lg leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                Family Nest is a private space for the people you come home to. Journals, voice memos, letters, recipes, traditions. No ads. No algorithm. No performing for an audience.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/login?mode=signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold shadow-lg transition-all duration-200 hover:brightness-110 hover:shadow-xl hover:-translate-y-0.5"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "#fff",
                  }}
                >
                  Start Your Family Nest
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/gift"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-semibold transition-all duration-200 hover:brightness-95 hover:-translate-y-0.5"
                  style={{
                    backgroundColor: "var(--secondary)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Gift className="h-4 w-4" style={{ color: "var(--primary)" }} />
                  Give as a Gift
                </Link>
              </div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Already have a Nest?{" "}
                <Link
                  href="/login"
                  className="font-semibold underline underline-offset-4 transition-colors"
                  style={{ color: "var(--primary)" }}
                >
                  Sign in to your Nest
                </Link>
              </p>
              {/* Trust signal */}
              <div className="flex items-center gap-2 mt-1">
                <Shield className="h-4 w-4" style={{ color: "var(--primary)" }} />
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  No ads. No algorithms. No selling your family photos to train AI. You&apos;re welcome.
                </p>
              </div>
            </div>
          </div>

          {/* Hero Product Preview — Phone-first mockup (mobile-first product) */}
          <div className="relative flex min-w-0 items-center justify-center">
            <div className="relative mx-auto" style={{ width: 272 }}>
              {/* Phone frame */}
              <div
                className="relative overflow-hidden rounded-[44px] shadow-2xl"
                style={{
                  width: 272,
                  height: 552,
                  border: "8px solid var(--foreground)",
                  backgroundColor: "var(--background)",
                }}
              >
                {/* Status bar */}
                <div
                  className="flex items-center justify-between px-6 pt-2.5 pb-1.5"
                  style={{ backgroundColor: "var(--surface)" }}
                >
                  <span className="text-[10px] font-semibold" style={{ color: "var(--foreground)" }}>9:41</span>
                  <div
                    className="rounded-full"
                    style={{ width: 52, height: 10, backgroundColor: "var(--foreground)", opacity: 0.9 }}
                  />
                  <span className="text-[10px] font-semibold" style={{ color: "var(--foreground)" }}>100%</span>
                </div>

                {/* App header */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <div className="flex items-center gap-1.5">
                    <p
                      className="text-[13px] font-bold"
                      style={{ fontFamily: "var(--font-display-serif)", color: "var(--foreground)" }}
                    >
                      The Thompsons
                    </p>
                    <ChevronDown className="h-3 w-3" style={{ color: "var(--muted)" }} />
                  </div>
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold"
                    style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                  >
                    +
                  </div>
                </div>

                {/* Journal title row */}
                <div className="flex items-center justify-between px-4 pt-1 pb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
                    Family Journal
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--muted)" }}>4 members</p>
                </div>

                {/* Journal entries — phone feed */}
                <div className="flex flex-col gap-2 px-3">
                  {[
                    {
                      title: "Beach day with the whole crew",
                      date: "June 14",
                      preview: "Catching our favourite sunset…",
                      photo: "/marketing/journal-1.jpeg",
                    },
                    {
                      title: "Grandma's birthday party",
                      date: "June 8",
                      preview: "Four generations around one table.",
                      photo: "/marketing/journal-2.jpeg",
                    },
                    {
                      title: "First day of summer break",
                      date: "June 1",
                      preview: "The look on their faces when…",
                      photo: null as string | null,
                    },
                  ].map((entry) => (
                    <div
                      key={entry.title}
                      className="flex gap-2.5 rounded-xl p-2"
                      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      {entry.photo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={entry.photo}
                          alt=""
                          width={44}
                          height={44}
                          className="h-11 w-11 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-base"
                          style={{ backgroundColor: "var(--surface)" }}
                        >
                          📔
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold truncate" style={{ color: "var(--foreground)" }}>
                          {entry.title}
                        </p>
                        <p className="text-[9px]" style={{ color: "var(--accent)" }}>
                          {entry.date}
                        </p>
                        <p className="text-[9px] truncate mt-0.5" style={{ color: "var(--muted)" }}>
                          {entry.preview}
                        </p>
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
                    <BookOpen className="h-4 w-4" style={{ color: "var(--accent)" }} />
                    <span className="text-[7px] font-medium" style={{ color: "var(--accent)" }}>Journal</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <Camera className="h-4 w-4" style={{ color: "var(--muted)" }} />
                    <span className="text-[7px]" style={{ color: "var(--muted)" }}>Photos</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <MapPin className="h-4 w-4" style={{ color: "var(--muted)" }} />
                    <span className="text-[7px]" style={{ color: "var(--muted)" }}>Map</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <Users className="h-4 w-4" style={{ color: "var(--muted)" }} />
                    <span className="text-[7px]" style={{ color: "var(--muted)" }}>Family</span>
                  </div>
                </div>
              </div>

              {/* Floating badge — "Works on any device" */}
              <div
                className="absolute -right-3 top-20 rotate-3 rounded-xl px-3 py-2 shadow-lg"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                <p className="text-[10px] font-medium opacity-80">Works on</p>
                <p className="text-[12px] font-bold">any device</p>
              </div>

              {/* Floating voice-memo hint — bottom left, quiet hint of more features */}
              <div
                className="absolute -left-4 bottom-24 -rotate-2 flex items-center gap-2 rounded-full px-3 py-1.5 shadow-lg"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  <Mic className="h-2.5 w-2.5 text-white" />
                </div>
                <p className="text-[10px] font-medium" style={{ color: "var(--foreground)" }}>
                  Voice memo · 0:18
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
