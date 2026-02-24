"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <html>
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#0a0a0a",
          color: "#f5f5f5",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center", width: "100%" }}>
          <div
            style={{
              margin: "0 auto 1.5rem",
              width: "4rem",
              height: "4rem",
              borderRadius: "1rem",
              background: "rgba(239,68,68,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
            }}
            aria-hidden="true"
          >
            ⚠️
          </div>

          <h1
            style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.75rem" }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              fontSize: "0.875rem",
              color: "#a3a3a3",
              margin: "0 0 0.5rem",
              lineHeight: 1.6,
            }}
          >
            A critical error occurred. You can try refreshing the page or go
            back to the home page.
          </p>

          {error.digest && (
            <p style={{ fontSize: "0.75rem", color: "#737373", margin: "0 0 2rem" }}>
              Error ID: {error.digest}
            </p>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "center",
            }}
          >
            <button
              onClick={reset}
              style={{
                minHeight: "44px",
                borderRadius: "9999px",
                background: "#7c3aed",
                color: "#fff",
                border: "none",
                padding: "0.625rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                minHeight: "44px",
                borderRadius: "0.5rem",
                border: "1px solid #333",
                color: "#f5f5f5",
                padding: "0.625rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
