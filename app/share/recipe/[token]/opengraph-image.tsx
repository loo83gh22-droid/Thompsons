import { ImageResponse } from "next/og";
import { createClient } from "@/src/lib/supabase/server";

export const alt = "Family Nest Recipe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: recipe } = await supabase
    .from("recipes")
    .select(
      "title, story, occasions, taught_by, family_id, created_at"
    )
    .eq("share_token", token)
    .eq("is_public", true)
    .single();

  if (!recipe) {
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
          Recipe not found
        </div>
      ),
      { ...size }
    );
  }

  // Fetch taught-by name
  let taughtByName = "";
  if (recipe.taught_by) {
    const { data: teacher } = await supabase
      .from("family_members")
      .select("name, nickname")
      .eq("id", recipe.taught_by)
      .single();
    if (teacher) taughtByName = teacher.nickname?.trim() || teacher.name;
  }

  // Fetch family name
  const { data: family } = await supabase
    .from("families")
    .select("name")
    .eq("id", recipe.family_id)
    .single();
  const familyName = family?.name || "A Family";

  // Truncate story for preview
  const excerpt = recipe.story
    ? recipe.story.length > 280
      ? recipe.story.slice(0, 280).trimEnd() + "…"
      : recipe.story
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
          From the {familyName} Kitchen
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
          {recipe.title}
        </span>

        {/* Taught by + occasions */}
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
          {taughtByName && <span>Taught by {taughtByName}</span>}
          {taughtByName && recipe.occasions && <span>·</span>}
          {recipe.occasions && <span>{recipe.occasions}</span>}
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
            Your family has recipes worth saving too.
          </span>
          <span
            style={{ fontSize: 14, color: "#7a7567", marginTop: 4 }}
          >
            familynest.io — Preserve the stories behind your food for
            generations.
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
