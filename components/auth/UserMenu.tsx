
import ClientUserMenu from "./UserMenu.client";

// If Clerk isn’t configured, fall back to signed-out UI
const CLERK_ON =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY;

export default async function UserMenu() {
  if (!CLERK_ON) return <ClientUserMenu isSignedIn={false} />;

  // Clerk v6 server helper
  const { auth } = await import("@clerk/nextjs/server");
  try {
    const { userId } = await auth();
    return <ClientUserMenu isSignedIn={!!userId} />;
  } catch {
    // If middleware isn’t matching this route, don’t crash the page
    return <ClientUserMenu isSignedIn={false} />;
  }
}