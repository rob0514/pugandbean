import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import type { UrlObject } from "url";

type Href = Route | UrlObject;
import { getAllPosts, getAllTags } from "@/lib/mdx/adapter";

const PAGE_SIZE = 5;

export const dynamic = "force-dynamic";
//export const dynamic = "force-static"; // cache at build
//export const revalidate = false;

type SearchParams = Promise<Record<string, string | string[] | undefined> | undefined>;
type Props = { searchParams: SearchParams };

const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

export default async function BlogIndex({ searchParams }: Props) {
  const raw = await searchParams;
  const sp = raw ?? {}; // <- guaranteed object
  const pageParam = first(sp.page);
  const tagParam  = first(sp.tag);
  const page = Math.max(1, Number(pageParam ?? 1));
  const activeTag = tagParam;
  const [all, tags] = await Promise.all([getAllPosts(), getAllTags()]);
  const filtered = activeTag ? all.filter(p => p.tags.includes(activeTag)) : all;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const items = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>

      {/* Tag Filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        <FilterChip href="/blog" active={!activeTag}>All</FilterChip>
        {Object.entries(tags).map(([tag, count]) => (
          <FilterChip key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`} active={tag===activeTag}>
            {tag} <span className="opacity-60">({count})</span>
          </FilterChip>
        ))}
      </div>

      <ul className="mt-8 space-y-8">
        {items.map(p => (
          <li key={p.slug}>
            <article className="space-y-2">
              <h2 className="text-2xl font-medium">
                <Link href={`/blog/${p.slug}`} className="hover:underline">
                  {p.title}
                </Link>
              </h2>
              <p className="text-sm opacity-70">
                {new Date(p.date).toLocaleDateString()} · {p.readingTime.text} · {p.tags.join(", ")}
              </p>
              <p className="opacity-90">{p.excerpt}</p>
            </article>
          </li>
        ))}
      </ul>

      {/* Pagination */}
      <nav className="mt-10 flex items-center justify-between">
        <PageBtn href={page > 1 ? `/blog?page=${page-1}${activeTag ? `&tag=${activeTag}` : ""}` : undefined}>
          ← Prev
        </PageBtn>
        <span className="text-sm opacity-70">Page {page} of {totalPages}</span>
        <PageBtn href={page < totalPages ? `/blog?page=${page+1}${activeTag ? `&tag=${activeTag}` : ""}` : undefined}>
          Next →
        </PageBtn>
      </nav>

      <Suspense fallback={null} />
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: Href;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-sm border ${
        active ? "bg-black text-white border-black" : "border-black/10 hover:bg-black/5"
      }`}
    >
      {children}
    </Link>
  );
}

function PageBtn({
  href,
  children,
}: {
  href?: Href;
  children: React.ReactNode;
}) {
  if (!href) return <span className="opacity-40">{children}</span>;
  return <Link href={href} className="underline">{children}</Link>;
}
/*import { listPosts } from '@/lib/posts'
import Link from 'next/link'


export default async function BlogIndex() {
const posts = await listPosts()
return (
<section className="px-6 md:px-10 lg:px-16 py-10">
<h1 className="font-display text-4xl">Blog</h1>
<div className="mt-8 grid gap-6 md:grid-cols-2">
{posts.map(p => (
<Link key={p.slug} href={`/blog/${p.slug}`} className="rounded-2xl bg-white p-6 shadow-soft block">
<div className="text-xs font-ui tracking-wide text-ink/60">{new Date(p.date).toLocaleDateString()}</div>
<h3 className="mt-1 text-xl font-medium">{p.title}</h3>
<p className="mt-2 text-ink/70">{p.excerpt}</p>
</Link>
))}
</div>
</section>
)
}*/