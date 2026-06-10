import Link from "next/link";
import { ArrowRight, Check, Gift, Heart, Shield, Infinity, HardDrive, Download } from "lucide-react";
import { Navbar } from "@/app/components/home/Navbar";
import { Footer } from "@/app/components/home/Footer";

const occasions = [
  { emoji: "🌸", label: "Mother's Day" },
  { emoji: "👔", label: "Father's Day" },
  { emoji: "🎄", label: "Christmas" },
  { emoji: "🎓", label: "Graduation" },
  { emoji: "👶", label: "New Baby" },
  { emoji: "💍", label: "Anniversary" },
  { emoji: "🕊️", label: "In Memory" },
];

const legacyFeatures = [
  { icon: Infinity, text: "Lifetime access. Pay once, keep it forever" },
  { icon: HardDrive, text: "10 GB storage included, add more anytime" },
  { icon: Download, text: "Full data export. Always own your family's memories" },
  { icon: Heart, text: "Everything in The Full Nest, forever" },
  { icon: Shield, text: "Bank-level encryption, private by default" },
];

const steps = [
  {
    number: "1",
    title: "Buy the gift in two minutes",
    description: "Enter your details and your recipient's name and email, add a personal message, and pay once. No account needed to give it.",
  },
  {
    number: "2",
    title: "We email them their gift",
    description: "Your recipient gets a warm email with a private link to claim their Legacy Nest — beautifully presented, with your message inside.",
  },
  {
    number: "3",
    title: "They open it in one click",
    description: "They set a password and their Nest is ready — Legacy plan, lifetime access, nothing to download or install.",
  },
  {
    number: "4",
    title: "The whole family joins free",
    description: "They invite everyone they love. No subscription, ever — the family's memories live in one private place.",
  },
];

export default function GiftPage() {
  return (
    <div className="landing" style={{ fontFamily: "var(--font-body)" }}>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-20 md:pt-44 md:pb-28">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "rgba(61,107,94,0.1)", color: "var(--primary)" }}
            >
              <Gift className="h-4 w-4" />
              A gift your whole family keeps — forever.
            </div>

            <h1
              className="mb-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
              style={{
                fontFamily: "var(--font-display-serif)",
                color: "var(--foreground)",
                textWrap: "balance",
              }}
            >
              The best gift for your family is the one you all keep.
            </h1>

            <p
              className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              The Legacy plan is a one-time gift your family keeps forever. Lifetime access. A private nest for journals, voice memos, photos, and everything worth holding onto. Buy it in two minutes — we&apos;ll send them a link to open it.
            </p>

            {/* Pricing callout */}
            <div className="mt-8 rounded-2xl border-2 p-6 text-center" style={{ borderColor: "var(--accent)", backgroundColor: "rgba(61,107,94,0.06)" }}>
              <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>The Legacy Plan</p>
              <div className="mt-2 flex items-baseline justify-center gap-3">
                <span className="font-display text-5xl font-bold" style={{ color: "var(--foreground)" }}>$349</span>
                <span className="text-xl" style={{ color: "var(--muted)" }}>one-time</span>
              </div>
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>Pay once. No subscription, ever. Yours for life.</p>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <Link
                href="/gift/buy"
                className="inline-flex items-center justify-center gap-2 rounded-full px-10 py-4 text-base font-semibold shadow-lg transition-all duration-200 hover:brightness-110 hover:shadow-xl hover:-translate-y-0.5"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
              >
                Give the Gift of Family Nest
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                $349 one-time &middot; No subscription &middot; Theirs for life
              </p>
            </div>
          </div>
        </section>

        {/* Occasions */}
        <section className="pb-16">
          <div className="mx-auto max-w-4xl px-6">
            <p
              className="mb-6 text-center text-sm font-medium uppercase tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              Perfect for every occasion
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {occasions.map(({ emoji, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
                  style={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  <span>{emoji}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Quote */}
        <section className="py-16">
          <div className="mx-auto max-w-3xl px-6">
            <div
              className="rounded-2xl p-10 text-center"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p
                className="mb-6 text-xl leading-relaxed md:text-2xl"
                style={{
                  fontFamily: "var(--font-display-serif)",
                  color: "var(--foreground)",
                  textWrap: "balance",
                }}
              >
                &ldquo;I set up the Nest, uploaded 20 years of our favourite family photos, and sent it to my mum.
                She cried. My wife said it was the best gift I&apos;d ever given.
                It cost less than a large bouquet of flowers.&rdquo;
              </p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Daniel R., Portland, OR
              </p>
            </div>
          </div>
        </section>

        {/* What's included */}
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p
                className="mb-3 text-sm font-medium uppercase tracking-widest"
                style={{ color: "var(--accent)" }}
              >
                The Legacy Plan
              </p>
              <h2
                className="mb-4 text-3xl font-bold md:text-4xl"
                style={{
                  fontFamily: "var(--font-display-serif)",
                  color: "var(--foreground)",
                  textWrap: "balance",
                }}
              >
                Everything they need, nothing they don&apos;t
              </h2>
              <p className="text-lg" style={{ color: "var(--muted)" }}>
                One payment. No renewals. The whole family joins free.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {legacyFeatures.map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-start gap-4 rounded-2xl p-6"
                  style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "rgba(61,107,94,0.1)" }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
                  </div>
                  <p className="text-sm leading-relaxed pt-1.5" style={{ color: "var(--foreground)" }}>
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20" style={{ backgroundColor: "var(--card)" }}>
          <div className="mx-auto max-w-4xl px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p
                className="mb-3 text-sm font-medium uppercase tracking-widest"
                style={{ color: "var(--accent)" }}
              >
                How to give it
              </p>
              <h2
                className="mb-4 text-3xl font-bold md:text-4xl"
                style={{
                  fontFamily: "var(--font-display-serif)",
                  color: "var(--foreground)",
                  textWrap: "balance",
                }}
              >
                It takes two minutes. They&apos;ll remember it forever.
              </h2>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              {steps.map((step) => (
                <div key={step.number} className="flex gap-5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                  >
                    {step.number}
                  </div>
                  <div>
                    <h3
                      className="mb-1.5 text-base font-semibold"
                      style={{ color: "var(--foreground)", fontFamily: "var(--font-display-serif)" }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison note */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-6">
            <div
              className="rounded-2xl p-10"
              style={{
                background: "linear-gradient(135deg, rgba(61,107,94,0.08) 0%, rgba(61,107,94,0.04) 100%)",
                border: "1px solid rgba(61,107,94,0.2)",
              }}
            >
              <h2
                className="mb-4 text-2xl font-bold md:text-3xl"
                style={{
                  fontFamily: "var(--font-display-serif)",
                  color: "var(--foreground)",
                  textWrap: "balance",
                }}
              >
                Less than a weekend away. Lasts a lifetime.
              </h2>
              <ul className="mb-8 flex flex-col gap-3">
                {[
                  "Less than a flight that gets forgotten in a week",
                  "Less than a gadget that ends up in a drawer",
                  "Less than a dinner out for the whole family",
                  "And it becomes more valuable every year they use it",
                  "Some families start a Nest to hold onto what they have. Others start one to make sure nothing else gets lost",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: "rgba(61,107,94,0.15)" }}
                    >
                      <Check className="h-3 w-3" style={{ color: "var(--primary)" }} />
                    </div>
                    <span className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/gift/buy"
                className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold shadow-md transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
              >
                Give the Gift of Family Nest
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="pb-24">
          <div className="mx-auto max-w-xl px-6 text-center">
            <p className="mb-2 text-sm" style={{ color: "var(--muted)" }}>
              Not sure if Legacy is right? Start with{" "}
              <Link
                href="/#pricing"
                className="underline underline-offset-4"
                style={{ color: "var(--primary)" }}
              >
                The Full Nest at $6.99/month
              </Link>
              . Upgrade anytime.
            </p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Questions?{" "}
              <Link
                href="/contact"
                className="underline underline-offset-4"
                style={{ color: "var(--primary)" }}
              >
                Get in touch
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
