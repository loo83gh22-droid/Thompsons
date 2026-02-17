import { Coffee, Heart, Smartphone } from "lucide-react";

export function Testimonials() {
  const stories = [
    {
      icon: Coffee,
      scenario: "The Grandma Test",
      story:
        "Picture this: Grandma opens the Nest with her morning coffee. New photos from the grandkids, a voice memo from her daughter, a recipe someone finally wrote down. No passwords to remember. No confusing feeds. Just her family.",
    },
    {
      icon: Heart,
      scenario: "The Recipes That Almost Disappeared",
      story:
        "Every family has recipes that live in someone's head. Handwriting that's fading. Stories only told at Thanksgiving. The Nest is where those things stop being fragile and start being permanent.",
    },
    {
      icon: Smartphone,
      scenario: "Private Instagram — Minus Everything Bad",
      story:
        "All the sharing. None of the ads, algorithms, or strangers. Just the cousins in Ohio, the aunt in Florida, the teens who actually check it, and Grandpa who just learned how to tap.",
    },
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p
            className="mb-3 text-sm font-medium uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            Imagine this
          </p>
          <h2
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{
              fontFamily: "var(--font-display-serif)",
              color: "var(--foreground)",
              textWrap: "balance",
            }}
          >
            The moments you&apos;ll actually preserve
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg" style={{ color: "var(--muted)" }}>
            Real scenarios from real family life. This is what a Nest is for.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border p-8"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: "rgba(61,107,94,0.1)" }}
              >
                <item.icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
              </div>
              <p
                className="mb-3 text-lg font-semibold"
                style={{
                  fontFamily: "var(--font-display-serif)",
                  color: "var(--foreground)",
                }}
              >
                {item.scenario}
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                {item.story}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
