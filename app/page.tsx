'use client'
import Link from 'next/link'
import type { Route } from "next";


export default function HomePage() {
return (
<section className="px-6 md:px-10 lg:px-16 py-16 grid gap-10">
<div className="max-w-3xl">
<h1 className="font-display text-5xl leading-tight">Smarter care. Stylish living.</h1>
<p className="mt-4 text-lg text-ink/80 max-w-prose">Resources, stories, and soon products — all designed to make life with small dogs easier, happier, and a little more beautiful.</p>
<div className="mt-6 flex gap-3">
<Link href="/blog" className="rounded-xl px-5 py-3 bg-fawn text-ink font-ui text-sm">Explore the Hub</Link>
<Link href="/shop" className="rounded-xl px-5 py-3 border border-ink/10 bg-warmgray">Shop (mock)</Link>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
<FeatureCard title="Smart Care" href="/blog?tag=care" />
<FeatureCard title="Life & Style" href="/blog?tag=style" />
<FeatureCard title="Community" href="/blog?tag=community" />
</div>
</section>
)
}


function FeatureCard({ title, href }: { title: string; href: string }) {
return (
<Link href={href as Route} className="rounded-2xl bg-white shadow-soft p-6 block focus:outline-none">
<h3 className="font-ui text-base tracking-wide">{title}</h3>
<p className="text-sm text-ink/70 mt-2">Curated reads and tools for small-dog people.</p>
</Link>
)
}

