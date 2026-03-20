import Link from "next/link";

export function PricingCallout() {
  return (
    <section className="py-10 md:py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div
          className="flex flex-col items-center justify-between gap-6 rounded-2xl px-8 py-7 text-center sm:flex-row sm:text-left md:px-12"
          style={{
            background: "linear-gradient(135deg, var(--surface) 0%, var(--card) 100%)",
            border: "1px solid var(--border)",
          }}
        >
          <div>
            <p
              className="text-xl font-bold"
              style={{ fontFamily: "var(--font-display-serif)", color: "var(--foreground)" }}
            >
              Free forever. No credit card needed.
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Unlimited journal entries and 500 MB storage on the free plan.{" "}
              <Link href="/pricing" className="font-medium underline underline-offset-2" style={{ color: "var(--accent)" }}>
                See all plans
              </Link>
            </p>
          </div>
          <Link
            href="/login?mode=signup"
            className="shrink-0 rounded-full px-7 py-3 text-sm font-semibold transition-all duration-200 hover:brightness-110 hover:shadow-md"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            Start for free →
          </Link>
        </div>
      </div>
    </section>
  );
}
