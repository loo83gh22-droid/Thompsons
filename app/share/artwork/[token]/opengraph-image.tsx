import { ImageResponse } from "next/og";
import { createAdminClient } from "@/src/lib/supabase/admin";

export const alt = "Family Nest Artwork";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ token: string }> };

export default async function OGImage({ params }: Props) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Fetch the publicly shared piece
  const { data: piece } = await supabase
    .from("artwork_pieces")
    .select("title, medium, age_when_created, family_member_id, family_id, artwork_photos(url, sort_order)")
    .eq("share_token", token)
    .eq("is_public", true)
    .single();

  // Fallback card if piece not found
  if (!piece) {
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
            fontFamily: "sans-serif",
          }}
        >
          Family Nest Artwork
        </div>
      ),
      { ...size }
    );
  }

  // Get artist name + family name
  let artistName = "";
  if (piece.family_member_id) {
    const { data: member } = await supabase
      .from("family_members")
      .select("name, nickname")
      .eq("id", piece.family_member_id)
      .single();
    if (member) artistName = member.nickname?.trim() || member.name;
  }

  const { data: family } = await supabase
    .from("families")
    .select("name")
    .eq("id", piece.family_id)
    .single();
  const familyName = family?.name || "A Family";

  // Get signed URL for the first photo
  const photos = [...(piece.artwork_photos ?? [])].sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );
  let photoUrl: string | null = null;
  if (photos[0]) {
    const storagePath = (photos[0] as { url: string }).url.replace("/api/storage/artwork-photos/", "");
    const { data: signed } = await supabase.storage
      .from("artwork-photos")
      .createSignedUrl(storagePath, 3600);
    photoUrl = signed?.signedUrl ?? null;
  }

  const MEDIUM_LABELS: Record<string, string> = {
    drawing: "Drawing",
    painting: "Painting",
    craft: "Craft",
    sculpture: "Sculpture",
    digital: "Digital Art",
    other: "Artwork",
  };
  const mediumLabel = piece.medium ? (MEDIUM_LABELS[piece.medium] ?? "Artwork") : "Artwork";
  const subtitle = [
    artistName && `By ${artistName}`,
    piece.age_when_created != null && `Age ${piece.age_when_created}`,
    mediumLabel,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          backgroundColor: "#f5f0ea",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left: info panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "40px 32px",
            flex: photoUrl ? "0 0 35%" : "1",
          }}
        >
          {/* Top: brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#c47c3a" }}>
              Family Nest
            </span>
            <span style={{ fontSize: 13, color: "#9c8f7a" }}>· Artwork</span>
          </div>

          {/* Middle: title + meta */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#c47c3a" }}>
              From the {familyName} Family
            </span>
            <span
              style={{
                fontSize: piece.title.length > 20 ? 28 : 34,
                fontWeight: 800,
                color: "#2c2a25",
                lineHeight: 1.15,
              }}
            >
              {piece.title}
            </span>
            {subtitle && (
              <span style={{ fontSize: 14, color: "#7a7567" }}>{subtitle}</span>
            )}
          </div>

          {/* Bottom: CTA */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#ebe6de",
              borderRadius: 12,
              padding: "12px 16px",
              gap: 3,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2c2a25" }}>
              Every family has art worth preserving.
            </span>
            <span style={{ fontSize: 11, color: "#7a7567" }}>
              familynest.io
            </span>
          </div>
        </div>

        {/* Right: artwork photo */}
        {photoUrl && (
          <div
            style={{
              flex: "0 0 65%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ede8e0",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={piece.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
