export function slugifyFromFilename(filename: string) {
  return filename.replace(/\.mdx?$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, ""); // drop leading date if present
}

export function isProd() {
  return process.env.NODE_ENV === "production";
}

export function canonical(base: string, path: string) {
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
}

// simple brand OG fallback (replace with your Cloud OG generator later)
export function ogFallbackFor(slug: string, base: string) {
  const title = encodeURIComponent(slug.replace(/-/g, " "));
  return `${base}/api/og?title=${title}`;
}
