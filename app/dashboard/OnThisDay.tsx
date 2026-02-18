import Link from "next/link";

export type OnThisDayItem = {
  type: "journal" | "voice_memo" | "story" | "photo";
  id: string;
  title: string | null;
  memberName: string | null;
  createdAt: string;
  href: string;
  yearsAgo: number;
};

const typeConfig: Record<
  OnThisDayItem["type"],
  { icon: string; verb: string; colour: string }
> = {
  journal: { icon: "📔", verb: "wrote a journal entry", colour: "bg-blue-50 border-blue-200 text-blue-700" },
  voice_memo: { icon: "🎙️", verb: "recorded a voice memo", colour: "bg-purple-50 border-purple-200 text-purple-700" },
  story: { icon: "📖", verb: "shared a story", colour: "bg-amber-50 border-amber-200 text-amber-700" },
  photo: { icon: "📷", verb: "added photos", colour: "bg-emerald-50 border-emerald-200 text-emerald-700" },
};

function yearsAgoLabel(n: number): string {
  if (n === 1) return "1 year ago";
  return `${n} years ago`;
}

export function OnThisDay({ items }: { items: OnThisDayItem[] }) {
  if (items.length === 0) return null;

  // Group by yearsAgo so multiple items from same year cluster nicely
  const byYear = new Map<number, OnThisDayItem[]>();
  for (const item of items) {
    const list = byYear.get(item.yearsAgo) ?? [];
    list.push(item);
    byYear.set(item.yearsAgo, list);
  }
  const years = Array.from(byYear.keys()).sort((a, b) => a - b);

  return (
    <section className="rounded-2xl border border-[var(--accent)]/20 bg-gradient-to-br from-[var(--accent)]/5 to-[var(--surface)] p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">🕰️</span>
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">
            On This Day
          </h2>
          <p className="text-sm text-[var(--muted)]">
            A look back at what your family was up to.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {years.map((year) => {
          const yearItems = byYear.get(year)!;
          return (
            <div key={year}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                {yearsAgoLabel(year)}
              </p>
              <div className="space-y-2">
                {yearItems.map((item) => {
                  const cfg = typeConfig[item.type];
                  return (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.href}
                      className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 transition-all duration-200 hover:border-[var(--accent)]/40 hover:shadow-md"
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--surface-hover)] text-xl">
                        {cfg.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[var(--muted)]">
                          {item.memberName ? (
                            <>
                              <span className="font-medium text-[var(--foreground)]">
                                {item.memberName}
                              </span>{" "}
                              {cfg.verb}
                            </>
                          ) : (
                            <span className="capitalize">{cfg.verb}</span>
                          )}
                        </p>
                        {item.title && (
                          <p className="mt-0.5 truncate font-medium text-[var(--foreground)]">
                            {item.title}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 self-center rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.colour}`}
                      >
                        {cfg.icon}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
