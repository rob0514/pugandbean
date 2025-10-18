import Link from 'next/link'
import Image from 'next/image'
import { type Product } from '@/types/product'


export function ProductCard({ product }: { product: Product }) {
const cover = product.images?.[0] ?? '/placeholder.png'
return (
<Link href={`/product/${product.slug}`} className="block rounded-2xl bg-white shadow-soft overflow-hidden">
<div className="relative aspect-square">
<Image src={cover} alt={product.title} fill className="object-cover" />
</div>
<div className="p-4">
<div className="text-sm text-ink/60 font-ui">${(product.price).toFixed(2)}</div>
<h3 className="mt-1 font-medium">{product.title}</h3>
</div>
</Link>
)
}