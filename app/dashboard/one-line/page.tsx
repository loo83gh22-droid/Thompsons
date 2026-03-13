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

  // Fetch today's entry (with content) and date-only index for streak/calendar
  const [todayRes, datesRes] = await Promise.all([
    supabase
      .from("one_line_entries")
      .select("id, entry_date, content")
      .eq("user_id", user.id)
      .eq("entry_date", today)
      .maybeSingle(),
    supabase
      .from("one_line_entries")
      .select("id, entry_date")
      .eq("user_id", user.id)
      .gte("entry_date", new Date(todayDate.getFullYear() - 5, todayDate.getMonth(), todayDate.getDate()).toISOString().split("T")[0])
      .order("entry_date", { ascending: false })
      .limit(1825),
  ]);

  const todayEntry = todayRes.data ?? null;
  const entries = datesRes.data ?? [];

  // "On this day" -- same month/day in prior years (need content for these)
  const onThisDayDates = entries.filter((e) => {
    if (e.entry_date === today) return false;
    const parts = e.entry_date.split("-");
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    return m === todayMonth && d === todayDay;
  });

  // Fetch content for "on this day" entries (at most 4 prior years)
  let onThisDay: { id: string; entry_date: string; content: string }[] = [];
  if (onThisDayDates.length > 0) {
    const { data } = await supabase
      .from("one_line_entries")
      .select("id, entry_date, content")
      .in("id", onThisDayDates.map((e) => e.id));
    onThisDay = (data ?? []) as typeof onThisDay;
  }

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
