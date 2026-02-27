import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "I open the Nest with my morning coffee. New photos from the grandkids, a voice memo from my daughter, a recipe someone finally wrote down. No passwords to remember. No confusing feeds. Just my family.",
    name: "Margaret T.",
    location: "Columbus, OH",
    role: "Grandmother of 7",
    scenario: "The Grandma Test",
  },
  {
    quote:
      "I set up the Nest, uploaded 20 years of our favourite family photos, invited everyone, and wrapped the login on a card. My mom cried. My wife said it was the best gift I'd ever given. It cost less than a large bouquet of flowers.",
    name: "Daniel R.",
    location: "Portland, OR",
    role: "Dad & Nest creator",
    scenario: "The Dad Who Nailed Christmas",
  },
  {
    quote:
      "My son started a Nest for his family. My daughter started one for hers. I'm in both — I just switch between them. I see my grandkids on both sides, all from one account. No juggling apps or group chats.",
    name: "Patricia L.",
    location: "Scottsdale, AZ",
    role: "Grandparent in two families",
    scenario: "One Account, Two Families",
  },
  {
    quote:
      "I used to be the only one saving photos and writing things down. Now my husband posts from the fishing trip, my mother-in-law shares her recipes, and the kids add their own stuff. I'm not the family archivist anymore.",
    name: "Jessica W.",
    location: "Nashville, TN",
    role: "Mom of three",
    scenario: "No Longer Doing It Alone",
  },
  {
    quote:
      "My grandmother's handwriting was fading on those recipe cards. Now her chicken soup recipe is in the Nest — with a voice memo of her explaining it. That's not just a recipe. That's her voice, saved forever.",
    name: "Marcus H.",
    location: "Chicago, IL",
    role: "Son & family historian",
    scenario: "The Recipes That Almost Disappeared",
  },
  {
    quote:
      "We tried a family group chat. Then a shared album. Then nothing stuck. The Nest is the first thing everyone actually uses — even my dad, who still calls it 'the family website.' He checks it every morning.",
    name: "Claire & Tom B.",
    location: "Austin, TX",
    role: "Parents of four",
    scenario: "The Thing That Actually Stuck",
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
            What families are saying
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg" style={{ color: "var(--muted)" }}>
            From grandmothers to dads to the kid who finally got Grandpa into the water.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <div
              key={index}
              className="flex flex-col rounded-2xl border p-8"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <div className="mb-4 flex items-start justify-between gap-2">
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
          ))}
        </div>
      </div>
    </section>
  );
}
