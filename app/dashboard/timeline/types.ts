export type TimelineItem = {
  id: string;
  date: string;
  type: "journal" | "voice_memo" | "time_capsule" | "photo" | "message" | "story" | "event" | "recipe" | "tradition";
  title: string;
  description: string | null;
  authorName: string | null;
  authorRelationship: string | null;
  authorMemberId: string | null;
  thumbnailUrl: string | null;
  href: string;
  /** Voice memo only: duration in seconds */
  durationSeconds?: number | null;
  /** Voice memo only: URL for playback */
  audioUrl?: string | null;
};
