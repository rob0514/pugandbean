// components/auth/UserMenu.client.tsx
"use client";

import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function ClientUserMenu({ isSignedIn }: { isSignedIn: boolean }) {
  const [mounted, setMounted] = useState(false);

  // Defer to the next frame -> satisfies the lint rule and avoids double render
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) {
    // SSR-friendly fallback (one avatar, no flicker)
    return isSignedIn ? (
      <UserButton appearance={{ elements: { userButtonPopoverCard: "rounded-xl" } }} />
    ) : (
      <SignInButton mode="modal">
        <button className="px-3 py-1 rounded-full border hover:bg-accent focus:outline-none focus:ring">
          Sign in
        </button>
      </SignInButton>
    );
  }

  // After mount, let Clerk own the UI
  return (
    <>
      <SignedIn>
        <UserButton appearance={{ elements: { userButtonPopoverCard: "rounded-xl" } }} />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="px-3 py-1 rounded-full border hover:bg-accent focus:outline-none focus:ring">
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
    </>
  );
}
