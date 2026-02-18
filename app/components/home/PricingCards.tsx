import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {
    name: "The Nest",
    price: "Free",
    period: "",
    description: "Dip your toes in. Start preserving for free.",
    features: ["10 journal entries", "500 MB storage", "Family tree", "Map view"],
    cta: "Get Started Free",
    featured: false,
  },
  {
    name: "The Full Nest",
    price: "$49",
    period: "/yr",
    description: "For families ready to go all in",
    features: [
      "Unlimited entries",
      "10 GB storage",
      "Videos & voice memos",
      "All core features",
    ],
    cta: "Start Your Family Nest",
    featured: false,
  },
  {
    name: "The Legacy",
    price: "$349",
    period: " one-time",
    description: "Pay once, keep it forever. Seriously.",
    features: [
      "Lifetime access",
      "50 GB storage",
      "Ownership transfer",
      "Full data export",
      "Everything in Full Nest",
    ],
    cta: "Claim Your Legacy",
    featured: true,
  },
];

export function PricingCards() {
  return (
    <section id="pricing" className="py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p
            className="mb-3 text-sm font-medium uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            Pricing
          </p>
          <h2
            className="mb-4 text-3xl md:text-4xl lg:text-5xl"
            style={{
              fontFamily: "var(--font-display-serif)",
              color: "var(--foreground)",
              textWrap: "balance",
            }}
          >
            No surprises. No subscriptions you forget about.
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
            Start free. Upgrade whenever you&apos;re ready. No pressure.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="relative flex flex-col rounded-2xl p-8 transition-shadow hover:shadow-lg"
              style={{
                border: plan.featured
                  ? "2px solid var(--primary)"
                  : "1px solid var(--border)",
                backgroundColor: "var(--card)",
                boxShadow: plan.featured
                  ? "0 4px 20px rgba(61,107,94,0.15), 0 0 0 2px rgba(61,107,94,0.1)"
                  : undefined,
              }}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className="rounded-full px-4 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: "var(--accent)",
                      color: "var(--accent-foreground)",
                    }}
                  >
                    Best Value
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3
                  className="mb-1 text-xl"
                  style={{
                    fontFamily: "var(--font-display-serif)",
                    color: "var(--foreground)",
                  }}
                >
                  {plan.name}
                </h3>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span
                  className="text-4xl"
                  style={{
                    fontFamily: "var(--font-display-serif)",
                    color: "var(--foreground)",
                  }}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm" style={{ color: "var(--muted)" }}>
                    {plan.period}
                  </span>
                )}
              </div>

              <ul className="mb-8 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: "rgba(61,107,94,0.1)" }}
                    >
                      <Check className="h-3 w-3" style={{ color: "var(--primary)" }} />
                    </div>
                    <span className="text-sm" style={{ color: "var(--muted)" }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/login?mode=signup"
                className="block w-full rounded-full py-3 text-center text-sm font-medium transition-colors"
                style={
                  plan.featured
                    ? {
                        backgroundColor: "var(--primary)",
                        color: "var(--primary-foreground)",
                      }
                    : {
                        backgroundColor: "var(--secondary)",
                        color: "var(--foreground)",
                        border: "1px solid var(--border)",
                      }
                }
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
