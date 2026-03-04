import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { OneLineClient } from "./OneLineClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "One Line A Day" };

export default async function OneLinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  // Today in YYYY-MM-DD (server timezone)
  const todayDate = new Date();
  const today = todayDate.toISOString().split("T")[0];
  const todayMonth = todayDate.getMonth() + 1;
  const todayDay = todayDate.getDate();

  // Fetch up to 5 years of entries for this user
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const { data: allEntries } = await supabase
    .from("one_line_entries")
    .select("id, entry_date, content")
    .eq("user_id", user.id)
    .gte("entry_date", fiveYearsAgo.toISOString().split("T")[0])
    .order("entry_date", { ascending: false });

  const entries = allEntries ?? [];

  // Today's entry
  const todayEntry = entries.find((e) => e.entry_date === today) ?? null;

  // "On this day" — same month/day in prior years
  const onThisDay = entries.filter((e) => {
    if (e.entry_date === today) return false;
    // Parse without timezone conversion
    const parts = e.entry_date.split("-");
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    return m === todayMonth && d === todayDay;
  });

  // Streak: consecutive days ending at today (or yesterday if today not written)
  const entryDates = new Set(entries.map((e) => e.entry_date));
  let streak = 0;
  const check = new Date(todayDate);
  if (!entryDates.has(today)) check.setDate(check.getDate() - 1);
  while (streak < 3650) {
    const dateStr = check.toISOString().split("T")[0];
    if (!entryDates.has(dateStr)) break;
    streak++;
    check.setDate(check.getDate() - 1);
  }

  // Dates with entries in the last 35 days for the mini-calendar
  const thirtyFiveDaysAgo = new Date(todayDate);
  thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 34);
  const recentDates = new Set(
    entries
      .filter((e) => e.entry_date >= thirtyFiveDaysAgo.toISOString().split("T")[0])
      .map((e) => e.entry_date)
  );

  return (
    <OneLineClient
      today={today}
      todayEntry={todayEntry}
      onThisDay={onThisDay}
      streak={streak}
      totalEntries={entries.length}
      recentDates={[...recentDates]}
    />
  );
}
