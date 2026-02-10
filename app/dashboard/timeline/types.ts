export type TimelineItem = {
  id: string;
  date: string;
  type: "journal" | "voice_memo" | "time_capsule" | "photo";
  title: string;
  description: string | null;
  authorName: string | null;
  authorMemberId: string | null;
  thumbnailUrl: string | null;
  href: string;
};
