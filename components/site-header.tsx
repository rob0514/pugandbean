'use client'
import Link from 'next/link'
import { useCart } from '@/lib/cart'


export function SiteHeader() {
const { open } = useCart()
return (
<header className="sticky top-0 z-40 bg-cream/80 backdrop-blur supports-[backdrop-filter]:bg-cream/60 border-b border-ink/10">
<div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 h-16 flex items-center justify-between">
<Link href="/" className="font-display text-2xl tracking-tight">Pug & Bean</Link>
<nav className="hidden md:flex gap-6 font-ui text-sm">
<Link href="/blog">Blog</Link>
<Link href="/shop">Shop</Link>
<Link href="/about">About</Link>
<Link href="/contact">Contact</Link>
</nav>
<button aria-label="Open cart" onClick={open} className="rounded-xl px-3 py-2 bg-fawn font-ui text-sm">Cart</button>
</div>
</header>
)
}