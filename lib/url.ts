// lib/url.ts
function publicOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  );
}

function isAbsolute(u: string) {
  return /^https?:\/\//i.test(u);
}

/** Absolute URL safe for current env; never appends :3000 to your public domain. */
export function toPublicUrl(input?: string | null): string | undefined {
  if (!input) return undefined;

  const base = publicOrigin();

  try {
    // Build a URL relative to base if needed
    const u = isAbsolute(input) ? new URL(input) : new URL(input, base);
    const pub = new URL(base);

    const isLocal = u.hostname === "localhost" || u.hostname === "127.0.0.1";

    if (isLocal) {
      // swap localhost → public
      u.protocol = pub.protocol;
      u.host = pub.host; // hostname + (prod never includes :3000)
      return u.toString();
    }

    // If the host is already your public host, strip any stray dev port
    if (u.hostname === pub.hostname && u.port) {
      u.port = "";
      return u.toString();
    }

    // Otherwise leave remote URLs untouched
    return u.toString();
  } catch {
    // last-ditch: concat
    return input.startsWith("/") ? `${base}${input}` : `${base}/${input}`;
  }
}

// For scripts writing to Stripe metadata:
export const canonicalizeForStripe = toPublicUrl;
