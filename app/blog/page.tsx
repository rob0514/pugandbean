import { listPosts } from '@/lib/posts'
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
}