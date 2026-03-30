'use client';

import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "As a mom, it\u2019s everything I want for my kids, saved in one place.",
    name: "Jodi T.",
    location: "Kelowna, BC",
    role: "Mom",
  },
  {
    quote:
      "I set up the Nest, uploaded 20 years of our favourite family photos, invited everyone, and wrapped the login on a card. My mom cried. My wife said it was the best gift I\u2019d ever given. It cost less than a large bouquet of flowers.",
    name: "Daniel R.",
    location: "Portland, OR",
    role: "Dad & Nest creator",
  },
  {
    quote:
      "We tried a family group chat. Then a shared album. Then nothing stuck. The Nest is the first thing everyone actually uses. Even my dad, who still calls it \u2018the family website.\u2019 He checks it every morning.",
    name: "Claire & Tom B.",
    location: "Austin, TX",
    role: "Parents of four",
  },
];

function StarRating() {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5 fill-current"
          style={{ color: "#f59e0b" }}
        />
      ))}
    </div>
  );
}

function TestimonialCard({ item }: { item: (typeof testimonials)[number] }) {
  return (
    <div
      className="flex flex-col rounded-2xl border p-8"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mb-4">
        <StarRating />
      </div>

      <blockquote
        className="flex-1 text-sm leading-relaxed"
        style={{ color: "var(--foreground)" }}
      >
        &ldquo;{item.quote}&rdquo;
      </blockquote>

      <div
        className="mt-6 flex items-center gap-3 border-t pt-5"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
          style={{
            backgroundColor: "rgba(61,107,94,0.12)",
            color: "var(--primary)",
          }}
        >
          {item.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {item.name}
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {item.role} &middot; {item.location}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p
            className="mb-3 text-sm font-medium uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            Loved by families
          </p>
          <h2
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{
              fontFamily: "var(--font-display-serif)",
              color: "var(--foreground)",
              textWrap: "balance",
            }}
          >
            Here&apos;s how families are using it
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg" style={{ color: "var(--muted)" }}>
            For the parents building it, the kids growing up in it, and the moments worth keeping.
          </p>
          <p className="mt-2 text-xs" style={{ color: "var(--muted)", opacity: 0.6 }}>
            Stories represent typical customer experiences.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item) => (
            <TestimonialCard key={item.name} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
