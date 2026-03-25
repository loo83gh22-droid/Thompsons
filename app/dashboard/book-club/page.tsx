import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { BookShelf } from "./BookShelf";

export const metadata = { title: "Book Club | Family Nest" };

export default async function BookClubPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const [{ data: members }, { data: books }] = await Promise.all([
    supabase
      .from("family_members")
      .select("id, name, nickname")
      .eq("family_id", activeFamilyId)
      .eq("is_remembered", false)
      .order("name"),
    supabase
      .from("book_club_books")
      .select("id, title, author, status, rating, notes, is_family_pick, member_id")
      .eq("family_id", activeFamilyId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
          📚 Book Club
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          What is everyone reading? Add books, rate them, and set the family pick.
        </p>
      </div>

      <BookShelf rawBooks={books ?? []} members={members ?? []} />
    </div>
  );
}
