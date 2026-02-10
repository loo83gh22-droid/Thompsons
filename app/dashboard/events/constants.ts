export const EVENT_CATEGORIES = [
  { value: "birthday", label: "Birthday", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  { value: "anniversary", label: "Anniversary", color: "bg-pink-500/20 text-pink-300 border-pink-500/40" },
  { value: "trip_vacation", label: "Trip/Vacation", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  { value: "holiday", label: "Holiday", color: "bg-red-500/20 text-red-300 border-red-500/40" },
  { value: "reunion", label: "Family Reunion", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  { value: "graduation", label: "Graduation", color: "bg-violet-500/20 text-violet-300 border-violet-500/40" },
  { value: "other", label: "Other", color: "bg-[var(--border)] text-[var(--muted)] border-[var(--border)]" },
] as const;

export type EventCategoryValue = (typeof EVENT_CATEGORIES)[number]["value"];

export function getCategoryLabel(value: string): string {
  return EVENT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function getCategoryColor(value: string): string {
  return EVENT_CATEGORIES.find((c) => c.value === value)?.color ?? EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1].color;
}
