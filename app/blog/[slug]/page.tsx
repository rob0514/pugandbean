import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPostBySlug } from "@/lib/mdx/adapter";
import { renderMDX } from "@/lib/mdx/compile";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
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

export default async function PostPage({ params }: { params: Params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return notFound();

  // JSON-LD Article
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

      <div className="mt-8">
        {await renderMDX(post.body)}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </article>
  );
}



/*import { getPostBySlug } from '@/lib/posts'
import { Prose } from '@/components/prose.mdx'

export default async function BlogPost({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const post = await getPostBySlug(slug)

    return (
        <article className="px-6 md:px-10 lg:px-16 py-10">
            <header className="max-w-3xl">
                <p className="text-xs font-ui text-ink/60">
                    {new Date(post.date).toLocaleDateString()}
                </p>
                <h1 className="font-display text-4xl leading-tight mt-2">{post.title}</h1>
            </header>
            <Prose className="mt-8 max-w-3xl" source={post.content} />
        </article>
    )
}*/
