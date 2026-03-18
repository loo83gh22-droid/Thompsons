import Link from "next/link";

export const metadata = { title: "Tools | Family Nest" };

const tools = [
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

export default function ToolsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Tools</h1>
        <p className="mt-2 text-[var(--muted)]">
          Practical planning tools to help your family coordinate and stay organized.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <div key={tool.title} className="relative">
            {tool.available ? (
              <Link
                href={tool.href}
                className="group block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--accent)]/40 hover:shadow-md"
              >
                <span className="text-3xl">{tool.icon}</span>
                <h2 className="mt-3 font-display text-lg font-semibold group-hover:text-[var(--accent)]">
                  {tool.title}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{tool.description}</p>
              </Link>
            ) : (
              <div className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 opacity-50">
                <span className="text-3xl grayscale">{tool.icon}</span>
                <h2 className="mt-3 font-display text-lg font-semibold">{tool.title}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{tool.description}</p>
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
