// lib/auth/session.ts
import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Route } from "next";

export async function getCurrentUser() {
  // null if not signed in
  return await currentUser();
}

export async function requireAuth(returnTo?: string) {
  const { userId } = await auth(); // v6 is async
  if (!userId) {
    const dest = (process.env.CLERK_SIGN_IN_URL || "/sign-in") as Route;
    const rt = returnTo ? (`?return_to=${encodeURIComponent(returnTo)}` as const) : "";
    // redirect() expects a Route; our string starts with "/" so cast is fine
    redirect((`${dest}${rt}` as unknown) as Route);
  }
  return userId;
}
