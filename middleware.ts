import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PATHS = [
  "/dashboard",
  "/ideas",
  "/scripts",
  "/seo",
  "/planner",
  "/analyzer",
  "/coach",
  "/creator-profile",
  "/affiliate",
  "/admin",
];

// Affiliate referral tracking: craftxapp.com/?ref=CODE is remembered in this
// cookie until signup, where it gets linked to the new account.
const REFERRAL_COOKIE = "craftx_ref";
const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 60; // 60 days, in seconds
const REFERRAL_CODE_PATTERN = /^[a-z0-9-]{3,40}$/;

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // Remember the first referral code a logged-out visitor arrives with.
  // Set after getUser() because Supabase may replace supabaseResponse above.
  const refParam = request.nextUrl.searchParams.get("ref")?.trim().toLowerCase();
  const alreadyReferred = request.cookies.has(REFERRAL_COOKIE);

  if (refParam && !user && !alreadyReferred && REFERRAL_CODE_PATTERN.test(refParam)) {
    supabaseResponse.cookies.set(REFERRAL_COOKIE, refParam, {
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};