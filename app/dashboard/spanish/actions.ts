"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getOrCreateFamilyMember(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let { data: member } = await supabase
    .from("family_members")
    .select("id, name")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    const { data: newMember, error } = await supabase
      .from("family_members")
      .insert({
        user_id: user.id,
        name: user.email?.split("@")[0] || "Family Member",
        color: "#3b82f6",
      })
      .select("id, name")
      .single();
    if (!error) member = newMember;
  }
  return member;
}

export type VocabItem = { id: string; spanish: string; english: string; type: string };
export type FlashcardProgress = { vocabulary_id: string; box_level: number; next_review_at: string | null };

export async function getMyFamilyMember() {
  const supabase = await createClient();
  return getOrCreateFamilyMember(supabase);
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const member = await getOrCreateFamilyMember(supabase);
  if (!member) return { streak: 0, vocabularyMastered: 0, memberName: "" };

  const today = new Date().toISOString().slice(0, 10);

  const { data: streaks } = await supabase
    .from("spanish_study_streaks")
    .select("study_date")
    .eq("family_member_id", member.id)
    .order("study_date", { ascending: false })
    .limit(30);

  let streak = 0;
  if (streaks?.length) {
    const dates = new Set(streaks.map((s) => s.study_date));
    let d = new Date();
    while (true) {
      const ds = d.toISOString().slice(0, 10);
      if (dates.has(ds)) streak++;
      else break;
      d.setDate(d.getDate() - 1);
    }
  }

  const { count } = await supabase
    .from("spanish_flashcard_progress")
    .select("id", { count: "exact", head: true })
    .eq("family_member_id", member.id)
    .gte("box_level", 5);

  return {
    streak,
    vocabularyMastered: count ?? 0,
    memberName: member.name,
  };
}

export async function getVocabularyForReview(limit = 10) {
  const supabase = await createClient();
  const member = await getOrCreateFamilyMember(supabase);
  if (!member) return [];

  const now = new Date().toISOString();

  const { data: progress } = await supabase
    .from("spanish_flashcard_progress")
    .select("vocabulary_id, box_level, next_review_at")
    .eq("family_member_id", member.id);

  const progressMap = new Map(
    (progress || []).map((p) => [
      p.vocabulary_id,
      { box_level: p.box_level, next_review_at: p.next_review_at },
    ])
  );

  const { data: allVocab } = await supabase
    .from("spanish_vocabulary")
    .select("id, spanish, english, type")
    .order("sort_order");

  if (!allVocab) return [];

  const due: { vocab: (typeof allVocab)[0]; progress?: { box_level: number; next_review_at: string | null } }[] = [];
  for (const v of allVocab) {
    const p = progressMap.get(v.id);
    const nextReview = p?.next_review_at;
    const isDue = !nextReview || nextReview <= now;
    if (isDue) due.push({ vocab: v, progress: p });
  }

  return due.slice(0, limit).map((d) => ({
    ...d.vocab,
    box_level: d.progress?.box_level ?? 0,
  }));
}

const LEITNER_INTERVALS = [0, 1, 3, 7, 14, 30]; // days

export async function recordFlashcardResult(
  vocabularyId: string,
  correct: boolean
) {
  const supabase = await createClient();
  const member = await getOrCreateFamilyMember(supabase);
  if (!member) throw new Error("Not authenticated");

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("spanish_flashcard_progress")
    .select("id, box_level")
    .eq("family_member_id", member.id)
    .eq("vocabulary_id", vocabularyId)
    .single();

  const newBox = existing
    ? correct
      ? Math.min(existing.box_level + 1, 5)
      : 0
    : correct
      ? 1
      : 0;

  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + LEITNER_INTERVALS[newBox]);

  if (existing) {
    await supabase
      .from("spanish_flashcard_progress")
      .update({
        box_level: newBox,
        next_review_at: nextReview.toISOString(),
        last_reviewed_at: now.toISOString(),
      })
      .eq("family_member_id", member.id)
      .eq("vocabulary_id", vocabularyId);
  } else {
    await supabase.from("spanish_flashcard_progress").insert({
      family_member_id: member.id,
      vocabulary_id: vocabularyId,
      box_level: newBox,
      next_review_at: nextReview.toISOString(),
      last_reviewed_at: now.toISOString(),
    });
  }

  const { data: existingStreak } = await supabase
    .from("spanish_study_streaks")
    .select("flashcards_reviewed, vocabulary_mastered")
    .eq("family_member_id", member.id)
    .eq("study_date", today)
    .single();

  const reviewed = (existingStreak?.flashcards_reviewed ?? 0) + 1;
  const mastered = (existingStreak?.vocabulary_mastered ?? 0) + (correct && newBox === 5 ? 1 : 0);

  await supabase.from("spanish_study_streaks").upsert(
    {
      family_member_id: member.id,
      study_date: today,
      flashcards_reviewed: reviewed,
      vocabulary_mastered: mastered,
    },
    { onConflict: "family_member_id,study_date" }
  );

  revalidatePath("/dashboard/spanish");
  revalidatePath("/dashboard/spanish/flashcards");
}

export async function getGrammarQuestions(limit = 10) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("spanish_grammar_questions")
    .select("id, infinitive, tense, person, correct_answer, wrong_answers")
    .limit(limit);
  return (data || []).map((q) => ({
    ...q,
    wrong_answers: (q.wrong_answers as string[]) || [],
  }));
}

export async function recordGrammarAttempt(questionId: string, correct: boolean) {
  const supabase = await createClient();
  const member = await getOrCreateFamilyMember(supabase);
  if (!member) throw new Error("Not authenticated");

  await supabase.from("spanish_grammar_attempts").insert({
    family_member_id: member.id,
    question_id: questionId,
    correct,
  });

  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase
    .from("spanish_study_streaks")
    .select("quiz_score")
    .eq("family_member_id", member.id)
    .eq("study_date", today)
    .single();

  const newScore = correct ? 100 : 0;
  const bestScore = existing?.quiz_score != null ? Math.max(existing.quiz_score, newScore) : newScore;

  await supabase.from("spanish_study_streaks").upsert(
    {
      family_member_id: member.id,
      study_date: today,
      quiz_score: bestScore,
    },
    { onConflict: "family_member_id,study_date" }
  );

  revalidatePath("/dashboard/spanish");
  revalidatePath("/dashboard/spanish/quiz");
}
