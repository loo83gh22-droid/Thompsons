const additionalFeatures = [
  "Family Messages",
  "Sports & Activities",
  "Family Traditions",
  "Birthday Reminders",
  "Global Search",
  "Shareable Links",
  "Kid Accounts",
  "Family Spotify",
];

export function AdditionalFeatures() {
  return (
    <section className="pb-20 md:pb-32">
      <div className="mx-auto max-w-6xl px-6">
        <div
          className="rounded-2xl p-8 text-center md:p-12"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--card)",
          }}
        >
          <p
            className="mb-3 text-sm font-medium uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            And so much more
          </p>
          <h3
            className="mb-8 text-2xl md:text-3xl"
            style={{
              fontFamily: "var(--font-display-serif)",
              color: "var(--foreground)",
            }}
          >
            Plus all the little things that make it feel like home
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {additionalFeatures.map((feature) => (
              <span
                key={feature}
                className="rounded-full px-4 py-2 text-sm font-normal"
                style={{
                  backgroundColor: "var(--secondary)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
