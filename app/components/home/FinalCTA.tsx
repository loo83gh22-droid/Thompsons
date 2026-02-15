import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-20 md:py-32" style={{ backgroundColor: "var(--card)" }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="mb-6 text-3xl md:text-4xl lg:text-5xl"
            style={{
              fontFamily: "var(--font-display-serif)",
              color: "var(--foreground)",
              textWrap: "balance",
            }}
          >
            Ready to get your whole family in one place?
          </h2>
          <p
            className="mb-10 text-lg leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            It takes 30 seconds to set up. Invite grandma, the cousins, your siblings, everyone.
            Start building something the whole family will love.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Link
              href="/login?mode=signup"
              className="inline-flex items-center justify-center gap-2 rounded-full px-10 py-3.5 text-base font-medium transition-colors hover:opacity-90"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              Start Your Family Nest
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Free forever &middot; No credit card needed
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              Already have an account?{" "}
              <Link
                href="/login"
                className="underline underline-offset-4 transition-colors"
                style={{ color: "var(--primary)" }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
