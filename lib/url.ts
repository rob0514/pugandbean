// lib/url.ts

function normalizePublicOrigin(): URL {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";

  const u = new URL(raw);

  const isLocal =
    u.hostname === "localhost" || u.hostname === "127.0.0.1";

  // In production domains, strip any port if someone set one by mistake
  if (!isLocal) u.port = "";

  // Also normalize trailing slash (URL keeps it consistent in .toString())
  return u;
}

function isAbsolute(input: string) {
  return /^https?:\/\//i.test(input);
}

/** Returns a safe absolute URL for the current env.
 *  - Leaves remote absolutes untouched
 *  - Swaps localhost→public origin
 *  - Strips any port for public domains (no :3000 on Vercel)
 *  - Resolves relatives against the public origin
 */
export function toPublicUrl(input?: string | null): string | undefined {
  if (!input) return undefined;

  const base = normalizePublicOrigin();

  // Absolute?
  if (isAbsolute(input)) {
    const u = new URL(input);

    const isLocal =
      u.hostname === "localhost" || u.hostname === "127.0.0.1";

    if (isLocal) {
      // localhost → public origin (port already stripped on base)
      u.protocol = base.protocol;
      u.hostname = base.hostname;
      u.port = base.port; // will be "" for prod
      return u.toString();
    }

    // Same host as public? ensure no port
    if (u.hostname === base.hostname && u.port) {
      u.port = ""; // strip :3000 (or any port)
      return u.toString();
    }

    // Different remote host → leave as-is
    return u.toString();
  }

  // Relative → resolve against sanitized public origin
  return new URL(input, base).toString();
}

// For scripts writing to Stripe metadata, reuse the same logic
export const canonicalizeForStripe = toPublicUrl;
