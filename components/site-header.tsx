//'use client'
import Link from 'next/link'
import UserMenu from "@/components/auth/UserMenu";
import CartButton from "@/components/CartButton.client";
import { ROUTES } from "@/lib/routes";


export function SiteHeader() {
return (
<header className="sticky top-0 z-10 bg-cream/80 backdrop-blur supports-[backdrop-filter]:bg-cream/60 border-b border-ink/10">
<div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 h-16 flex items-center justify-between">
<Link href="/" className="font-display text-2xl tracking-tight">Pug & Bean</Link>
<nav className="hidden md:flex gap-6 font-ui text-sm">
<Link href="/blog">Blog</Link>
<Link href="/shop">Shop</Link>
<Link href="/about">About</Link>
<Link href="/contact">Contact</Link>
<Link href="/dev/snipcart">Snipcart</Link>
<Link href={ROUTES.orders}>Orders</Link>
<UserMenu />
</nav>
<CartButton />
</div>
</header>
)
}