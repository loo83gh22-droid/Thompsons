import { createClient } from "@/src/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ResumeEditor } from "./ResumeEditor";

export default async function ResumePage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("family_members")
    .select("id, name")
    .eq("id", memberId)
    .single();

  if (!member) notFound();

  const { data: resume } = await supabase
    .from("family_resumes")
    .select("content")
    .eq("family_member_id", memberId)
    .single();

  return (
    <div>
      <Link
        href="/dashboard/achievements"
        className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← Back to Achievements
      </Link>

      <h1 className="mt-6 font-display text-3xl font-bold text-[var(--foreground)]">
        {member.name}&apos;s Resume
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Keep it updated. Use plain text or simple formatting.
      </p>

      <ResumeEditor
        familyMemberId={memberId}
        initialContent={resume?.content ?? ""}
      />
    </div>
  );
}
