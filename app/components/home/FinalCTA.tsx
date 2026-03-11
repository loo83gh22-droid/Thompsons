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
            Ready to start preserving your story?
          </h2>
          <p
            className="mb-10 text-lg leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            It takes 30 seconds to set up. Whether it&apos;s just the two of you or three
            generations deep — everyone belongs. Already been invited? Just sign
            up and you&apos;ll find your Nest waiting for you.
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
              Just the two of you? That counts. Or give it as a gift — the one they&apos;ll actually keep forever.{" "}
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
