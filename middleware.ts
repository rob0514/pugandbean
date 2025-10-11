// middleware.ts
import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Run on (almost) everything so server auth() works anywhere,
// but we'll only *protect* specific routes below.
export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)", // all paths except files and _next
    "/",                      // root
    "/(api)(.*)",             // api (optional)
  ],
};

const isProtectedRoute = createRouteMatcher(["/account(.*)", "/orders(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const useAuth = process.env.USE_AUTH !== "false";
  if (!useAuth) return NextResponse.next();

  // Only gate these; everything else just gets middleware context so auth() works.
  if (isProtectedRoute(req)) {
    const { userId, redirectToSignIn } = await auth();
    if (!userId) return redirectToSignIn({ returnBackUrl: req.url });
  }

  return NextResponse.next();
});
