// Prefer NEXT_PUBLIC_APP_URL for anything rendered client-side.
// Fallback to APP_URL, then localhost for dev.
function publicOrigin() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  );
}

function isAbsolute(u: string): boolean {
  return /^https?:\/\//i.test(u);
}

/** Returns an absolute URL safe for the current env. */
export function toPublicUrl(input?: string | null): string | undefined {
  if (!input) return undefined;

  const base = publicOrigin();
if (isAbsolute(input)) {
    try {
      const u = new URL(input);
      const isLocal = u.hostname === "localhost" || u.hostname === "127.0.0.1";
      if (!isLocal) {
        // ensure no dev port sneaks onto public host
        const pub = new URL(base);
        const isSameHost = u.hostname === pub.hostname;
        if (isSameHost && u.port) {
          u.port = ""; // strip any port from public domain
          return u.toString();
        }
        return u.toString(); // leave other absolute URLs alone
      }
      // absolute but local → swap to public
      const pub = new URL(base);
      u.protocol = pub.protocol;
      u.host = pub.host; // hostname:port
      return u.toString();
    } catch {
      // fall through to relative handling
    }
  }

  // Relative → resolve against public origin
  try {
    return new URL(input, base).toString();
  } catch {
    return input.startsWith("/") ? `${base}${input}` : `${base}/${input}`;
  }
}

/** For writing to Stripe metadata in scripts */
export const canonicalizeForStripe = toPublicUrl;
