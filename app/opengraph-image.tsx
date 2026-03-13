import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Family Nest | Private Family Journal & Memory App";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#2D6B52",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "serif",
        }}
      >
        {/* Subtle texture overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.07) 0%, transparent 60%)",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
            }}
          >
            🏡
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: "600",
              color: "rgba(255,255,255,0.9)",
              letterSpacing: "-0.5px",
            }}
          >
            Family Nest
          </span>
        </div>

        {/* Main headline */}
        <div
          style={{
            fontSize: "68px",
            fontWeight: "700",
            color: "#ffffff",
            lineHeight: 1.1,
            letterSpacing: "-2px",
            maxWidth: "800px",
            marginBottom: "28px",
          }}
        >
          Private. Permanent. Yours.
        </div>

        {/* Subheadline */}
        <div
          style={{
            fontSize: "28px",
            color: "rgba(255,255,255,0.75)",
            maxWidth: "680px",
            lineHeight: 1.4,
            marginBottom: "56px",
          }}
        >
          A private space for your family&apos;s journals, photos, voice memos,
          and memories. Not social media.
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {[
            "📓 Family Journal",
            "📷 Photos & Video",
            "🎙️ Voice Memos",
            "🗺️ Family Map",
            "⏳ Time Capsules",
          ].map((label) => (
            <div
              key={label}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "100px",
                padding: "10px 20px",
                fontSize: "18px",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: "48px",
            right: "80px",
            fontSize: "20px",
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.5px",
          }}
        >
          familynest.io
        </div>
      </div>
    ),
    { ...size }
  );
}
