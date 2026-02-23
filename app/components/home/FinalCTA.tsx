import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-20 md:py-32" style={{ backgroundColor: "var(--card)" }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="mb-6 text-3xl font-bold md:text-4xl lg:text-5xl"
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
            It takes 30 seconds to set up. Invite your parents, the grandparents, the kids — everyone
            under your family tree. Already been invited? Just sign
            up and you&apos;ll find your family&apos;s Nest waiting for you.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Link
              href="/login?mode=signup"
              className="inline-flex items-center justify-center gap-2 rounded-full px-10 py-4 text-base font-semibold shadow-lg transition-all duration-200 hover:brightness-110 hover:shadow-xl hover:-translate-y-0.5"
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
            <p
              className="mt-4 text-sm"
              style={{ color: "var(--muted)", fontStyle: "italic" }}
            >
              Or give it as a gift — the one they&apos;ll actually keep forever.{" "}
              <Link
                href="#pricing"
                className="underline underline-offset-4 transition-colors"
                style={{ color: "var(--primary)", fontStyle: "normal" }}
              >
                See The Legacy plan
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
