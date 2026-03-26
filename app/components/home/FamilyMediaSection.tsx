const rows = [
  {
    label: "Who can see your content",
    social: "Anyone. The world. Strangers.",
    family: "Only the family members you invite.",
  },
  {
    label: "What controls what you see",
    social: "An algorithm optimizing for your attention.",
    family: "Chronological. What your family added. That's it.",
  },
  {
    label: "Why it was built",
    social: "To keep you on the platform as long as possible.",
    family: "To help you remember what matters.",
  },
  {
    label: "How it makes money",
    social: "Ads. Powered by your family's data and behavior.",
    family: "Subscriptions. Your data is never for sale.",
  },
  {
    label: "Your kids",
    social: "Exposed to strangers, algorithms, and advertisers.",
    family: "Seen only by family. No exceptions.",
  },
  {
    label: "What happens to your memories",
    social: "Buried in a feed. Gone in 24 hours. Or deleted when the platform decides.",
    family: "Permanent. Searchable. Yours to export anytime.",
  },
];

export function FamilyMediaSection() {
  return (
    <section className="py-20 md:py-28" style={{ backgroundColor: "var(--surface)" }}>
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-12">
          <p
            className="mb-3 text-sm font-medium uppercase tracking-widest"
            style={{ color: "var(--primary)" }}
          >
            Not the same thing
          </p>
          <h2
            className="text-3xl font-bold md:text-4xl"
            style={{
              fontFamily: "var(--font-display-serif)",
              color: "var(--foreground)",
              textWrap: "balance",
            }}
          >
            Family media. Not social media.
          </h2>
          <p className="mt-4 text-lg max-w-xl mx-auto" style={{ color: "var(--muted)" }}>
            Social media is great for connecting with the world. Family Nest is for something different.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
          {/* Header row */}
          <div
            className="grid grid-cols-3 px-5 py-3 text-xs font-semibold uppercase tracking-widest"
            style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}
          >
            <div style={{ color: "var(--muted)" }} />
            <div className="text-center" style={{ color: "var(--muted)" }}>Social Media</div>
            <div className="text-center" style={{ color: "var(--primary)" }}>Family Nest</div>
          </div>

          {rows.map((row, i) => (
            <div
              key={row.label}
              className="grid grid-cols-3 px-5 py-4 gap-4 items-start text-sm"
              style={{
                borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : undefined,
                backgroundColor: i % 2 === 0 ? "var(--background)" : "var(--card)",
              }}
            >
              <p className="font-medium text-xs leading-snug" style={{ color: "var(--foreground)" }}>
                {row.label}
              </p>
              <p className="text-center text-xs leading-snug" style={{ color: "var(--muted)" }}>
                {row.social}
              </p>
              <p className="text-center text-xs font-medium leading-snug" style={{ color: "var(--primary)" }}>
                {row.family}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
