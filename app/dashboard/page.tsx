import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
        Welcome home
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Your family hub. Pick a destination below.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          href="/dashboard/map"
          title="Family Map"
          description="See where the family has been. Add your own pins."
          icon="🗺️"
        />
        <DashboardCard
          href="/dashboard/journal"
          title="Journal"
          description="Trips, birthdays, celebrations. Add photos. Others can add their perspective to any entry."
          icon="📔"
        />
        <DashboardCard
          href="/dashboard/photos"
          title="Photos"
          description="All uploaded photos can be found here and these are used to complete your background mosaics."
          icon="🖼️"
        />
        <DashboardCard
          href="/dashboard/achievements"
          title="Achievements"
          description="Log achievements and team photos."
          icon="🏆"
        />
        <DashboardCard
          href="/dashboard/voice-memos"
          title="Voice Memos"
          description="Record voices for the future—stories, songs, jokes. Preserve personality."
          icon="🎙️"
        />
        <DashboardCard
          href="/dashboard/time-capsules"
          title="Time Capsules"
          description="Write letters for the future. Seal them until a date like &quot;Read when you turn 18.&quot;"
          icon="📮"
        />
        <DashboardCard
          href="/dashboard/recipes"
          title="Recipes"
          description="The story behind the food — who taught it, what occasions, photos from dinners."
          icon="🍳"
        />
        <DashboardCard
          href="/dashboard/traditions"
          title="Traditions"
          description="Taco Tuesday chants, holiday rituals, inside jokes — the cultural DNA that gets lost."
          icon="🏠"
        />
        <DashboardCard
          href="/dashboard/family-tree"
          title="Family Tree"
          description="See how the family connects. Parents, children, and relationships."
          icon="🌳"
        />
        <DashboardCard
          href="/dashboard/favourites"
          title="Favourites"
          description="Books, movies, shows, games — the stuff we love."
          icon="⭐"
        />
        <DashboardCard
          href="/dashboard/members"
          title="Members"
          description="See everyone in your family. Add new members with name, relationship, and email."
          icon="👋"
        />
        <DashboardCard
          href="/dashboard/messages"
          title="Messages"
          description="Send a message that pops up when family logs in. Perfect for Valentine's Day!"
          icon="💌"
        />
        <DashboardCard
          href="/dashboard/death-box"
          title="Da Box"
          description="Sensitive documents and wishes. Password protected."
          icon="📦"
        />
      </div>
    </div>
  );
}

function DashboardCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
    >
      <span className="text-3xl">{icon}</span>
      <h2 className="mt-4 font-display text-xl font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">
        {title}
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
    </Link>
  );
}
