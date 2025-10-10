import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { globby } from "globby";
import type { Post, PostFrontmatter, PostListItem } from "./types";
import { computeReadingTime } from "./reading-time";
import { slugifyFromFilename, isProd, canonical, ogFallbackFor } from "./utils";

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function resolveOg(front: PostFrontmatter, slug: string) {
  if (front.cover) return front.cover;
  return ogFallbackFor(slug, SITE_URL);
}

async function readOne(file: string): Promise<Post> {
  const raw = await fs.readFile(file, "utf8");
  const { data, content } = matter(raw);
  const fm = data as PostFrontmatter;

  if (!fm.title) throw new Error(`Missing title in ${file}`);
  if (!fm.date) throw new Error(`Missing date in ${file}`);
  if (!fm.excerpt) throw new Error(`Missing excerpt in ${file}`);
  if (!Array.isArray(fm.tags)) throw new Error(`tags must be string[] in ${file}`);

  const slug = fm.slug || slugifyFromFilename(path.basename(file));
  const readingTime = computeReadingTime(content);

  return {
    ...fm,
    slug,
    readingTime,
    body: content,
    ogImage: resolveOg(fm, slug),
    url: `/blog/${slug}`,
    _filepath: file,
  };
}


function showDrafts() {
  return !isProd() && process.env.SHOW_DRAFTS === "true";
}

export async function getAllPosts(): Promise<PostListItem[]> {
  const files = await globby(["**/*.mdx"], { cwd: CONTENT_DIR, absolute: true });
  const posts = await Promise.all(files.map(readOne));
  const filtered = posts.filter((p) => {
    if (isProd()) return !p.draft;          // always hide in prod
    if (!showDrafts()) return !p.draft;     // hide in dev unless SHOW_DRAFTS=true
    return true;                             // SHOW_DRAFTS=true → include drafts
  });
  // newest first
  filtered.sort((a, b) => +new Date(b.date) - +new Date(a.date));
 return filtered.map(({ body: _body, ...rest }) => rest);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const files = await globby(["**/*.mdx"], { cwd: CONTENT_DIR, absolute: true });
  for (const f of files) {
    const p = await readOne(f);
    if (p.slug === slug) {
       if (isProd() && p.draft) return null;
    if (!isProd() && !showDrafts() && p.draft) return null;
      return p;
    }
  }
  return null;
}

export async function getAllTags(): Promise<Record<string, number>> {
  const posts = await getAllPosts();
  const counts: Record<string, number> = {};
  posts.forEach(p => p.tags.forEach(t => (counts[t] = (counts[t] || 0) + 1)));
  return counts;
}
