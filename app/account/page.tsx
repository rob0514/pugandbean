import { getCurrentUser, requireAuth } from "@/lib/auth/session";

export const dynamic = "force-dynamic"; // ensure fresh auth state

export default async function AccountPage() {
  await requireAuth("/account");
  const user = await getCurrentUser();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold">My Account</h1>
      <div className="mt-6 space-y-2">
        <p className="text-sm text-muted-foreground">
          Signed in as {user?.primaryEmailAddress?.emailAddress ?? "unknown"}.
        </p>
        <p className="text-sm">This is the account hub (minimal for M5).</p>
      </div>
    </main>
  );
}
