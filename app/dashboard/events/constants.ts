export const EVENT_CATEGORIES = [
  { value: "birthday", label: "Birthday", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { value: "anniversary", label: "Anniversary", color: "bg-pink-50 text-pink-600 border-pink-200" },
  { value: "trip_vacation", label: "Trip/Vacation", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { value: "holiday", label: "Holiday", color: "bg-red-50 text-red-600 border-red-200" },
  { value: "reunion", label: "Family Reunion", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "graduation", label: "Graduation", color: "bg-violet-50 text-violet-600 border-violet-200" },
  { value: "other", label: "Other", color: "bg-[var(--border)] text-[var(--muted)] border-[var(--border)]" },
] as const;

export type EventCategoryValue = (typeof EVENT_CATEGORIES)[number]["value"];

export function getCategoryLabel(value: string): string {
  return EVENT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function getCategoryColor(value: string): string {
  return EVENT_CATEGORIES.find((c) => c.value === value)?.color ?? EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1].color;
}
