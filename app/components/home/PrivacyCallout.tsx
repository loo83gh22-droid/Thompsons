import { ShieldCheck } from "lucide-react";

export function PrivacyCallout() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
            <ShieldCheck className="h-4 w-4" style={{ color: "var(--primary)" }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--primary)" }}>
              Privacy
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
            The part where most apps would say &ldquo;we take your privacy seriously&rdquo;
          </h2>

          <div
            className="mx-auto max-w-2xl flex flex-col gap-5 text-lg leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            <p>
              We could say that. But you&apos;ve read that sentence from companies
              who were actively selling your search history, so it doesn&apos;t
              mean much anymore.
            </p>
            <p>
              Here&apos;s what we actually do: Your photos stay yours. We don&apos;t
              train AI on them. We don&apos;t show you ads. We don&apos;t build a
              profile on your family. There&apos;s no &ldquo;free tier that&apos;s
              actually you being the product.&rdquo; The free tier is just... free.
            </p>
            <p style={{ color: "var(--foreground)", fontWeight: 500 }}>
              If that sounds like a low bar, you&apos;re right. But apparently
              someone had to clear it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
