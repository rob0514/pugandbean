// components/auth/UserMenu.tsx (server component)
import ClientUserMenu from "./UserMenu.client";

// Import the *server* variant
import { auth } from "@clerk/nextjs/server";

const useAuth = process.env.USE_AUTH !== "false";

export default async function UserMenu() {
  if (!useAuth) {
    // Feature flag off → no auth UI at all
    return null;
  }

  const { userId } = await auth(); // v6 is async
  return <ClientUserMenu isSignedIn={!!userId} />;
}
