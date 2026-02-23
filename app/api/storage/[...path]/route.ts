import { createClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Authenticated storage proxy.
 *
 * URL pattern: /api/storage/<bucket>/<...path>
 *
 * 1. Verifies the caller has an active Supabase session.
 * 2. Fetches the object from private Supabase storage using the service-role key.
 * 3. Streams the file back with appropriate caching headers.
 *
 * This lets all storage buckets be private while still serving files to
 * authenticated users via a simple relative URL.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // 1. Auth check — reject unauthenticated requests immediately
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 2. Reconstruct the storage path: first segment is bucket, rest is object path
  const segments = (await params).path;
  if (!segments || segments.length < 2) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const bucket = segments[0];
  const objectPath = segments.slice(1).join("/");

  // 3. Fetch from Supabase storage using service-role key (bypasses bucket public setting)
  const storageUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${objectPath}`;

  const upstream = await fetch(storageUrl, {
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
  });

  if (!upstream.ok) {
    return new NextResponse("Not Found", { status: upstream.status });
  }

  // 4. Stream back with safe cache headers
  // Cache for 1 hour on the browser — files are immutable once stored
  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const contentLength = upstream.headers.get("content-length");

  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control": "private, max-age=3600",
    // Prevent the Next.js image optimizer from re-processing these responses
    "X-Content-Type-Options": "nosniff",
  });

  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers,
  });
}
