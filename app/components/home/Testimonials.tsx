export function Testimonials() {
  const testimonials = [
    {
      quote:
        "Finally, a place where Grandma can see all our photos without needing to understand Google Photos. She checks the Nest every morning with her coffee.",
      author: "Sarah M.",
      role: "Mom of 3",
    },
    {
      quote:
        "We found recipes we thought were lost forever when my mom passed. Now they're preserved for my grandkids to make someday.",
      author: "David & Linda T.",
      role: "Grandparents",
    },
    {
      quote:
        "It's like a private Instagram but only for people who matter. No ads, no algorithm, just our family.",
      author: "Alex K.",
      role: "Family organizer",
    },
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by families everywhere
          </h2>
          <p className="mt-4 text-lg" style={{ color: "var(--muted)" }}>
            See what families are saying about Our Family Nest
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="rounded-2xl border p-8"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <p
                className="text-lg leading-relaxed"
                style={{ color: "var(--foreground)" }}
              >
                "{testimonial.quote}"
              </p>
              <div className="mt-6">
                <p
                  className="font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {testimonial.author}
                </p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {testimonial.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
