import Link from "next/link";

export const metadata = { title: "Plan | Family Nest" };

const plans = [
  {
    title: "Bucket List",
    description: "Dream big together. Track the adventures, goals, and milestones your family wants to reach.",
    href: "/dashboard/bucket-list",
    icon: "🌟",
    available: true,
  },
  {
    title: "Reunion Planner",
    description: "Coordinate dates, RSVPs, and who's bringing what for your next family gathering.",
    href: "/dashboard/tools/reunion-planner",
    icon: "🎉",
    available: true,
  },
  {
    title: "Gift Exchange",
    description: "Secret Santa draws, wishlists, and budget tracking for the holidays.",
    icon: "🎁",
    href: "#",
    available: false,
  },
  {
    title: "Trip Planner",
    description: "Build itineraries, packing lists, and coordinate travel logistics together.",
    icon: "✈️",
    href: "#",
    available: false,
  },
  {
    title: "Countdown Timer",
    description: "Visual countdowns to the events your family is most excited about.",
    icon: "⏳",
    href: "#",
    available: false,
  },
  {
    title: "Emergency Info",
    description: "Keep medical contacts, allergies, insurance, and important numbers in one place.",
    icon: "🏥",
    href: "#",
    available: false,
  },
];

export default function PlanPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Plan</h1>
        <p className="mt-2 text-[var(--muted)]">
          Dream it, plan it, make it happen.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.title} className="relative">
            {plan.available ? (
              <Link
                href={plan.href}
                className="group block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--accent)]/40 hover:shadow-md"
              >
                <span className="text-3xl">{plan.icon}</span>
                <h2 className="mt-3 font-display text-lg font-semibold group-hover:text-[var(--accent)]">
                  {plan.title}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{plan.description}</p>
              </Link>
            ) : (
              <div className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 opacity-50">
                <span className="text-3xl grayscale">{plan.icon}</span>
                <h2 className="mt-3 font-display text-lg font-semibold">{plan.title}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{plan.description}</p>
                <span className="mt-3 inline-block rounded-full bg-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                  Coming soon
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
