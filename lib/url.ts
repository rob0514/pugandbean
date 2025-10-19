// Prefer NEXT_PUBLIC_APP_URL for anything rendered client-side.
// Fallback to APP_URL, then localhost for dev.
function publicOrigin() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  );
}

/** Returns an absolute URL safe for the current env. */
export function toPublicUrl(input?: string | null): string | undefined {
  if (!input) return undefined;

  const base = publicOrigin();

  try {
    // If input is relative, URL() resolves it against base.
    const u = new URL(input, base);

    // If the URL points at localhost in prod, swap to public origin.
    const isLocalHost =
      u.hostname === "localhost" || u.hostname === "127.0.0.1";

    if (isLocalHost) {
      const pub = new URL(base);
      u.protocol = pub.protocol;
      u.host = pub.host; // hostname + port (if any)
    }
    return u.toString();
  } catch {
    // If URL() threw (rare), best-effort concat for leading slash
    return input.startsWith("/") ? `${base}${input}` : `${base}/${input}`;
  }
}

/** For writing to Stripe metadata: ensure absolute, swap localhost→public on prod */
export function canonicalizeForStripe(input?: string | null): string | undefined {
  return toPublicUrl(input ?? undefined);
}
