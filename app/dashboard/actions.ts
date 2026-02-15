"use server";

import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";

export type RecentBirthday = {
  memberName: string;
  memberId: string;
  date: string;
  relationship: string;
  daysAgo: number;
};

export type RecentHoliday = {
  holidayName: string;
  date: string;
  daysAgo: number;
};

/**
 * Check for recent birthdays (within last 3 days) of:
 * - The current user
 * - Immediate family (parents, children, spouse)
 */
export async function checkRecentBirthdays(): Promise<RecentBirthday[]> {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return [];

  // Get current user's member ID
  const { data: currentUser } = await supabase.auth.getUser();
  const { data: currentMemberData } = await supabase
    .from("family_members")
    .select("id")
    .eq("family_id", activeFamilyId)
    .eq("user_id", currentUser.user?.id)
    .single();

  if (!currentMemberData) return [];

  const currentMemberId = currentMemberData.id;
  const today = new Date();
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 3);

  // Get all family members with birth dates
  const { data: members } = await supabase
    .from("family_members")
    .select("id, name, birth_date")
    .eq("family_id", activeFamilyId)
    .not("birth_date", "is", null);

  if (!members || members.length === 0) return [];

  // Get relationships for immediate family filtering
  const { data: relationships } = await supabase
    .from("family_relationships")
    .select("member_id, related_id, relationship_type")
    .or(`member_id.eq.${currentMemberId},related_id.eq.${currentMemberId}`);

  // Build set of immediate family member IDs
  const immediateFamilyIds = new Set<string>([currentMemberId]); // Include self
  relationships?.forEach((rel) => {
    if (
      rel.relationship_type === "parent" ||
      rel.relationship_type === "child" ||
      rel.relationship_type === "spouse"
    ) {
      if (rel.member_id === currentMemberId) {
        immediateFamilyIds.add(rel.related_id);
      } else if (rel.related_id === currentMemberId) {
        immediateFamilyIds.add(rel.member_id);
      }
    }
  });

  // Check which members had birthdays in last 3 days
  const recentBirthdays: RecentBirthday[] = [];

  for (const member of members) {
    if (!immediateFamilyIds.has(member.id)) continue; // Skip non-immediate family
    if (!member.birth_date) continue;

    const birthDate = new Date(member.birth_date);
    const thisYearBirthday = new Date(
      today.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate()
    );

    // Check if birthday was within last 3 days
    const daysDiff = Math.floor(
      (today.getTime() - thisYearBirthday.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff >= 0 && daysDiff <= 3) {
      // Find relationship label
      let relationship = "Self";
      if (member.id !== currentMemberId) {
        const rel = relationships?.find(
          (r) =>
            (r.member_id === currentMemberId && r.related_id === member.id) ||
            (r.related_id === currentMemberId && r.member_id === member.id)
        );
        relationship = rel?.relationship_type || "Family member";
      }

      recentBirthdays.push({
        memberName: member.name,
        memberId: member.id,
        date: thisYearBirthday.toISOString().split("T")[0],
        relationship,
        daysAgo: daysDiff,
      });
    }
  }

  return recentBirthdays;
}

/**
 * Check for major holidays in the last 3 days
 */
export async function checkRecentHolidays(): Promise<RecentHoliday[]> {
  const today = new Date();
  const currentYear = today.getFullYear();

  // Define major US holidays
  const holidays = [
    {
      name: "New Year's Day",
      date: new Date(currentYear, 0, 1),
    },
    {
      name: "Independence Day",
      date: new Date(currentYear, 6, 4),
    },
    {
      name: "Thanksgiving",
      date: getNthDayOfMonth(currentYear, 10, 4, 4), // 4th Thursday of November
    },
    {
      name: "Christmas",
      date: new Date(currentYear, 11, 25),
    },
  ];

  const recentHolidays: RecentHoliday[] = [];

  for (const holiday of holidays) {
    const daysDiff = Math.floor(
      (today.getTime() - holiday.date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff >= 0 && daysDiff <= 3) {
      recentHolidays.push({
        holidayName: holiday.name,
        date: holiday.date.toISOString().split("T")[0],
        daysAgo: daysDiff,
      });
    }
  }

  return recentHolidays;
}

/**
 * Helper: Get the Nth occurrence of a weekday in a month
 * Example: 4th Thursday of November for Thanksgiving
 */
function getNthDayOfMonth(
  year: number,
  month: number,
  weekday: number,
  n: number
): Date {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();

  // Calculate offset to first occurrence of target weekday
  let offset = weekday - firstWeekday;
  if (offset < 0) offset += 7;

  // Add weeks to get nth occurrence
  const day = 1 + offset + (n - 1) * 7;

  return new Date(year, month, day);
}
