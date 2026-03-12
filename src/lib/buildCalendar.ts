const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export type CalendarMonth<T> = {
  month: number;
  label: string;
  entries: T[];
};

export type CalendarYear<T> = {
  year: number;
  months: CalendarMonth<T>[];
  entryCount: number;
};

/**
 * Groups items into a Year > Month hierarchy, sorted newest-first.
 * @param items - The items to group
 * @param getDate - Extracts a Date from each item
 */
export function buildCalendar<T>(
  items: T[],
  getDate: (item: T) => Date
): CalendarYear<T>[] {
  const yearMap = new Map<number, Map<number, T[]>>();

  for (const item of items) {
    const d = getDate(item);
    const y = d.getFullYear();
    const m = d.getMonth();
    if (!yearMap.has(y)) yearMap.set(y, new Map());
    const monthMap = yearMap.get(y)!;
    if (!monthMap.has(m)) monthMap.set(m, []);
    monthMap.get(m)!.push(item);
  }

  const years: CalendarYear<T>[] = [];
  for (const [year, monthMap] of yearMap) {
    const months: CalendarMonth<T>[] = [];
    let entryCount = 0;
    for (const [month, monthEntries] of monthMap) {
      months.push({ month, label: MONTH_NAMES[month], entries: monthEntries });
      entryCount += monthEntries.length;
    }
    months.sort((a, b) => b.month - a.month);
    years.push({ year, months, entryCount });
  }
  years.sort((a, b) => b.year - a.year);
  return years;
}
