import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(
  /^https?:\/\//,
  ""
)?.split("/")[0];

const nextConfig: NextConfig = {
  reactStrictMode: false, // Prevents duplicate map in dev (Strict Mode double-mount)
  // Explicit root so build doesn't infer wrong workspace (e.g. on Vercel)
  turbopack: { root: "." },
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
};

export default nextConfig;
