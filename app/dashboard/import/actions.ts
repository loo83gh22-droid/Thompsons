"use server";

import { createClient } from "@/src/lib/supabase/server";
import { requireRole } from "@/src/lib/requireRole";
import { revalidatePath } from "next/cache";
import type {
  ContentType,
  ParsedJournalEntry,
  ParsedStory,
  ParsedRecipe,
  ParsedEvent,
  ParsedRow,
} from "./parsers";

export interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

export async function executeImport(
  rows: ParsedRow[],
  contentType: ContentType
): Promise<ImportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { created: 0, skipped: 0, errors: ["Not authenticated"] };

  let auth: { memberId: string; familyId: string };
  try {
    auth = await requireRole(supabase, user.id, ["owner", "adult"]);
  } catch (e) {
    return {
      created: 0,
      skipped: 0,
      errors: [e instanceof Error ? e.message : "Insufficient permissions"],
    };
  }

  const { memberId, familyId } = auth;

  // Build a name → id lookup for family members so we can resolve "author"
  const { data: members } = await supabase
    .from("family_members")
    .select("id, name")
    .eq("family_id", familyId);

  const memberByName = new Map<string, string>();
  for (const m of members ?? []) {
    if (m.name) memberByName.set(m.name.toLowerCase().trim(), m.id);
  }

  const resolveMember = (name?: string): string | null => {
    if (!name) return null;
    return memberByName.get(name.toLowerCase().trim()) ?? null;
  };

  const errors: string[] = [];
  let created = 0;
  let skipped = 0;

  if (contentType === "journal_entries") {
    for (const row of rows as ParsedJournalEntry[]) {
      if (!row.title?.trim()) { skipped++; continue; }
      const { error } = await supabase.from("journal_entries").insert({
        family_id: familyId,
        created_by: memberId,
        author_id: resolveMember(row.author) ?? memberId,
        title: row.title.trim(),
        content: row.content ?? null,
        trip_date: row.trip_date ?? null,
        trip_date_end: row.trip_date_end ?? null,
        location: row.location ?? null,
      });
      if (error) {
        errors.push(`"${row.title}": ${error.message}`);
        skipped++;
      } else {
        created++;
      }
    }
    revalidatePath("/dashboard/journal");
  } else if (contentType === "stories") {
    for (const row of rows as ParsedStory[]) {
      if (!row.title?.trim()) { skipped++; continue; }
      const validCategories = [
        "memorable_moments",
        "family_history",
        "advice_wisdom",
        "traditions",
        "recipes_food",
        "other",
      ];
      const category =
        row.category && validCategories.includes(row.category)
          ? row.category
          : "other";
      const { error } = await supabase.from("family_stories").insert({
        family_id: familyId,
        created_by: memberId,
        author_family_member_id: resolveMember(row.author) ?? memberId,
        title: row.title.trim(),
        content: row.content ?? "",
        category,
        published: true,
      });
      if (error) {
        errors.push(`"${row.title}": ${error.message}`);
        skipped++;
      } else {
        created++;
      }
    }
    revalidatePath("/dashboard/stories");
  } else if (contentType === "recipes") {
    // Get max sort_order
    const { data: last } = await supabase
      .from("recipes")
      .select("sort_order")
      .eq("family_id", familyId)
      .order("sort_order", { ascending: false })
      .limit(1);
    let nextOrder = (last?.[0]?.sort_order ?? -1) + 1;

    for (const row of rows as ParsedRecipe[]) {
      if (!row.title?.trim()) { skipped++; continue; }
      const { error } = await supabase.from("recipes").insert({
        family_id: familyId,
        added_by: memberId,
        title: row.title.trim(),
        story: row.story ?? null,
        ingredients: row.ingredients ?? null,
        instructions: row.instructions ?? null,
        occasions: row.occasions ?? null,
        sort_order: nextOrder++,
      });
      if (error) {
        errors.push(`"${row.title}": ${error.message}`);
        skipped++;
      } else {
        created++;
      }
    }
    revalidatePath("/dashboard/recipes");
  } else if (contentType === "events") {
    for (const row of rows as ParsedEvent[]) {
      if (!row.title?.trim() || !row.event_date) { skipped++; continue; }
      const validCategories = ["birthday", "anniversary", "holiday", "reunion", "other"];
      const validRecurring = ["none", "annual", "monthly"];
      const { error } = await supabase.from("family_events").insert({
        family_id: familyId,
        created_by: memberId,
        title: row.title.trim(),
        event_date: row.event_date,
        description: row.description ?? null,
        category:
          row.category && validCategories.includes(row.category)
            ? row.category
            : "other",
        recurring:
          row.recurring && validRecurring.includes(row.recurring)
            ? row.recurring
            : "none",
      });
      if (error) {
        errors.push(`"${row.title}": ${error.message}`);
        skipped++;
      } else {
        created++;
      }
    }
    revalidatePath("/dashboard/events");
  }

  return { created, skipped, errors };
}
