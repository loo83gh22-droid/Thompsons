import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.next({ request });
  }

  const supabaseResponse = NextResponse.next({ request });

  // Track cookies we set so we can forward them to the layout (same-request fix for stale session)
  const cookiesSetBySupabase: { name: string; value: string }[] = [];

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
            cookiesSetBySupabase.push({ name, value });
          });
        },
      },
    }
  );

  // Refresh session if needed (Server Components can't write cookies, so we must do it here)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.refresh_token) {
    await supabase.auth.refreshSession({ refresh_token: session.refresh_token });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect dashboard: redirect to login if no user
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // So layout sees refreshed session in the same request (Next.js #57655 workaround)
  if (cookiesSetBySupabase.length > 0) {
    const existing = Object.fromEntries(
      request.cookies.getAll().map((c) => [c.name, c.value])
    );
    cookiesSetBySupabase.forEach(({ name, value }) => {
      existing[name] = value;
    });
    const cookieHeader = Object.entries(existing)
      .map(([n, v]) => `${n}=${v}`)
      .join("; ");
    const newHeaders = new Headers(request.headers);
    newHeaders.set("cookie", cookieHeader);
    const newRequest = new NextRequest(request.url, {
      headers: newHeaders,
    });
    const response = NextResponse.next({ request: newRequest });
    // Keep Set-Cookie on response so the browser gets refreshed session
    supabaseResponse.cookies.getAll().forEach((c) => {
      response.cookies.set(c.name, c.value);
    });
    return response;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
