import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.next({ request });
  }

  // Must be `let` so the setAll handler can reassign it with updated cookies
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Forward new cookies onto the request so Server Components see the
        // refreshed session within the same request cycle, then rebuild the
        // response so the browser receives the updated Set-Cookie headers.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Never call getSession() + refreshSession() manually — refresh
  // tokens are single-use and calling refreshSession() on every request causes
  // a race condition when multiple parallel requests consume the same token,
  // invalidating the others and forcing users back to the login page.
  //
  // getUser() validates with the Supabase auth server and automatically
  // triggers a token refresh (via setAll) only when the access token is
  // actually expired.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect dashboard: redirect to login if no authenticated user
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
