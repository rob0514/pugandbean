import { getPostBySlug } from '@/lib/posts'
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
}
