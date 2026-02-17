import Link from "next/link";
import { ArrowRight, BookOpen, MapPin, Camera, Mic, Heart, Users } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text Content */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <p
                className="text-sm font-medium uppercase tracking-widest"
                style={{ color: "var(--accent)" }}
              >
                For every generation, under one roof
              </p>
              <h1
                className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
                style={{
                  fontFamily: "var(--font-display-serif)",
                  color: "var(--foreground)",
                  textWrap: "balance",
                }}
              >
                Your whole family&apos;s favorite place on the internet
              </h1>
              <p
                className="max-w-lg text-lg leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                A private, beautiful space where grandparents, parents, aunts, uncles, teens,
                and kids all come together. Journals, photos, videos, voice memos, recipes,
                and so much more. You start it. Your whole family makes it theirs.
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
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Free forever &middot; No credit card needed
                </p>
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>
                🏡 Built by a family, for families — now open to everyone
              </p>
            </div>
          </div>

          {/* Hero Product Preview — App UI mockup */}
          <div className="relative">
            <div
              className="relative overflow-hidden rounded-2xl shadow-2xl"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
              {/* Top bar */}
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
              >
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--border)" }} />
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--border)" }} />
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--border)" }} />
                </div>
                <div
                  className="mx-auto rounded-md px-12 py-1 text-[10px]"
                  style={{ backgroundColor: "var(--background)", color: "var(--muted)" }}
                >
                  ourfamilynest.com
                </div>
              </div>

              {/* Sidebar + Content layout */}
              <div className="flex" style={{ minHeight: "320px" }}>
                {/* Sidebar nav */}
                <div
                  className="hidden sm:flex w-44 shrink-0 flex-col gap-1 p-3"
                  style={{ borderRight: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
                >
                  <p
                    className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--muted)" }}
                  >
                    The Thompsons
                  </p>
                  {[
                    { icon: BookOpen, label: "Journal", active: true },
                    { icon: Camera, label: "Photos", active: false },
                    { icon: MapPin, label: "Family Map", active: false },
                    { icon: Users, label: "Family Tree", active: false },
                    { icon: Mic, label: "Voice Memos", active: false },
                    { icon: Heart, label: "Traditions", active: false },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs"
                      style={{
                        backgroundColor: item.active ? "rgba(61,107,94,0.1)" : "transparent",
                        color: item.active ? "var(--primary)" : "var(--muted)",
                        fontWeight: item.active ? 600 : 400,
                      }}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </div>
                  ))}
                </div>

                {/* Main content area — journal entries */}
                <div className="flex-1 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--foreground)", fontFamily: "var(--font-display-serif)" }}
                    >
                      Family Journal
                    </p>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                    >
                      + New Entry
                    </span>
                  </div>

                  {/* Mock journal entries */}
                  <div className="flex flex-col gap-2.5">
                    {[
                      {
                        title: "Beach day with the whole crew",
                        date: "June 14",
                        preview: "The kids finally got Grandpa in the water...",
                        hasPhoto: true,
                      },
                      {
                        title: "Nana's birthday dinner",
                        date: "June 8",
                        preview: "Three generations around one table. Made her famous...",
                        hasPhoto: true,
                      },
                      {
                        title: "First day of summer break",
                        date: "June 1",
                        preview: "The look on their faces when we told them about the trip...",
                        hasPhoto: false,
                      },
                    ].map((entry) => (
                      <div
                        key={entry.title}
                        className="flex gap-3 rounded-xl p-2.5"
                        style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
                      >
                        {entry.hasPhoto && (
                          <div
                            className="h-14 w-14 shrink-0 rounded-lg"
                            style={{
                              backgroundColor: "var(--secondary)",
                              backgroundImage: "linear-gradient(135deg, var(--secondary) 0%, var(--border) 100%)",
                            }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate" style={{ color: "var(--foreground)" }}>
                            {entry.title}
                          </p>
                          <p className="text-[10px]" style={{ color: "var(--accent)" }}>
                            {entry.date}
                          </p>
                          <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--muted)" }}>
                            {entry.preview}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating accent badge */}
            <div
              className="absolute -bottom-3 -right-3 rounded-xl px-3 py-2 shadow-lg sm:-bottom-4 sm:-right-4"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              <p className="text-[10px] font-medium opacity-75">Updated just now</p>
              <p className="text-xs font-semibold">3 family members online</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
