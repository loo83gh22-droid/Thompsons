import { createClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Authenticated storage proxy.
 *
 * URL pattern: /api/storage/<bucket>/<...path>
 *
 * 1. Verifies the caller has an active Supabase session.
 * 2. Creates a short-lived signed URL using the user's own session.
 * 3. Fetches the file server-side via the signed URL and streams it back.
 *
 * The signed URL is never exposed to the browser — only the /api/storage URL
 * is ever seen by the client. Requires storage SELECT policy on each bucket.
 */

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

  // 3. Generate a short-lived signed URL using the user's own session.
  //    60 seconds is enough — it's only used for the server-side fetch below.
  const { data: signedData, error: signError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, 60);

  if (signError || !signedData?.signedUrl) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 4. Fetch the file server-side using the signed URL — never exposed to browser
  const upstream = await fetch(signedData.signedUrl);
  if (!upstream.ok) {
    return new NextResponse("Not Found", { status: upstream.status });
  }

  // 5. Stream back with safe cache headers
  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const contentLength = upstream.headers.get("content-length");

  const headers = new Headers({
    "Content-Type": contentType,
    // Cache for 1 hour on the browser — files are immutable once stored
    "Cache-Control": "private, max-age=3600",
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
