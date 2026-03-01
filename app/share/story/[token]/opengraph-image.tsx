import { ImageResponse } from "next/og";
// Share pages use the admin (service-role) client — anon RLS policies for public shares were removed in migration 070. Token validation is enforced in app code via share_token + is_public filters (MED-1 fix).
import { createAdminClient } from "@/src/lib/supabase/admin";

export const alt = "Family Nest Story";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: story } = await supabase
    .from("family_stories")
    .select(
      "title, content, created_at, author_family_member_id, family_id"
    )
    .eq("share_token", token)
    .eq("is_public", true)
    .single();

  if (!story) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f5f0ea",
            fontSize: 40,
            color: "#3d3929",
          }}
        >
          Story not found
        </div>
      ),
      { ...size }
    );
  }

  // Fetch author name
  let authorName = "";
  if (story.author_family_member_id) {
    const { data: author } = await supabase
      .from("family_members")
      .select("name, nickname")
      .eq("id", story.author_family_member_id)
      .single();
    if (author) authorName = author.nickname?.trim() || author.name;
  }

  // Fetch family name
  const { data: family } = await supabase
    .from("families")
    .select("name")
    .eq("id", story.family_id)
    .single();
  const familyName = family?.name || "A Family";

  // Format date
  const date = new Date(story.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Truncate content for preview
  const excerpt = story.content
    ? story.content.length > 280
      ? story.content.slice(0, 280).trimEnd() + "…"
      : story.content
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f5f0ea",
          padding: "50px 60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar: brand + CTA */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 30,
          }}
        >
          <span style={{ fontSize: 22, color: "#3d6b50", fontWeight: 600 }}>
            Family Nest
          </span>
          <div
            style={{
              display: "flex",
              backgroundColor: "#3d6b50",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              padding: "10px 24px",
              borderRadius: 999,
            }}
          >
            Start Your Family Nest
          </div>
        </div>

        {/* From family */}
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#8b6f1a",
            marginBottom: 8,
          }}
        >
          From the {familyName} Family
        </span>

        {/* Title */}
        <span
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: "#2c2a25",
            lineHeight: 1.15,
            marginBottom: 12,
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {story.title}
        </span>

        {/* Author + date */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 17,
            color: "#7a7567",
            marginBottom: 24,
          }}
        >
          {authorName && <span>By {authorName}</span>}
          {authorName && <span>·</span>}
          <span>{date}</span>
        </div>

        {/* Excerpt */}
        <span
          style={{
            fontSize: 20,
            color: "#5c5749",
            lineHeight: 1.6,
            flex: 1,
            overflow: "hidden",
          }}
        >
          {excerpt}
        </span>

        {/* Bottom CTA bar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "#ebe6de",
            borderRadius: 16,
            padding: "20px 32px",
            marginTop: 16,
          }}
        >
          <span
            style={{ fontSize: 18, fontWeight: 700, color: "#2c2a25" }}
          >
            Every family has stories worth preserving.
          </span>
          <span
            style={{ fontSize: 14, color: "#7a7567", marginTop: 4 }}
          >
            familynest.io — Capture memories, photos, recipes, and voices
            for generations.
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
