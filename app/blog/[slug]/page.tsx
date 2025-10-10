// app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug } from "@/lib/mdx/adapter";
import { renderMDX } from "@/lib/mdx/compile";

type Params = Promise<{ slug: string }>;

export async function generateMetadata(
  { params }: { params: Params }
): Promise<Metadata> {
  const { slug } = await params;                 // ← await params
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = new URL(post.url, base).toString();

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url,
      images: [{ url: post.ogImage }],
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.ogImage],
    },
  };
}

export default async function PostPage(
  { params }: { params: Params }
) {
  const { slug } = await params;                 // ← await params
  const post = await getPostBySlug(slug);
  if (!post) return notFound();

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.date,
    image: post.ogImage,
    url: new URL(post.url, base).toString(),
    author: { "@type": "Person", name: "Pug & Bean" },
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-semibold tracking-tight">{post.title}</h1>
      <p className="mt-2 text-sm opacity-70">
        {new Date(post.date).toLocaleDateString()} · {post.readingTime.text} · {post.tags.join(", ")}
      </p>
      <div className="mt-8">{await renderMDX(post.body)}</div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </article>
  );
}
