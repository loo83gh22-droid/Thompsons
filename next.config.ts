import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(
  /^https?:\/\//,
  ""
)?.split("/")[0];

const nextConfig: NextConfig = {
  reactStrictMode: false, // Prevents duplicate map in dev (Strict Mode double-mount)
  // Explicit root so build doesn't infer wrong workspace (e.g. on Vercel)
  turbopack: { root: "." },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50MB",
    },
  },
  images: supabaseHost
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ],
      }
    : {},
  async headers() {
    const supabaseOrigin = supabaseHost ? `https://${supabaseHost}` : "";
    const csp = [
      "default-src 'self'",
      // Next.js requires unsafe-inline for hydration scripts; unsafe-eval for Turbopack dev HMR
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com",
      // Tailwind and Next.js inject inline styles
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Images: own origin, Supabase storage, Google Maps tiles, data URIs, blobs
      `img-src 'self' data: blob: ${supabaseOrigin} https://maps.googleapis.com https://maps.gstatic.com`,
      // API / WebSocket connections
      `connect-src 'self' ${supabaseOrigin} wss://${supabaseHost ?? ""} https://maps.googleapis.com`,
      // Audio / video from Supabase storage
      `media-src 'self' blob: ${supabaseOrigin}`,
      "font-src 'self' https://fonts.gstatic.com",
      // Service workers and audio worklets need blob:
      "worker-src 'self' blob:",
      "frame-src 'none'",
      "object-src 'none'",
    ]
      .filter(Boolean)
      .join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(self), payment=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
