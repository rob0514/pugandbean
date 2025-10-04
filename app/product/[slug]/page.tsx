import products from '@/data/products.json'
import { notFound } from 'next/navigation'
import { type Product } from '@/types/product'
import { ProductGallery } from '@/components/product-gallery'
import { AddToCartButton } from '@/components/cart-drawer'

export default async function ProductPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const product = (products as Product[]).find(p => p.slug === slug)
    if (!product) return notFound()

    return (
        <section className="px-6 md:px-10 lg:px-16 py-10 grid gap-8 md:grid-cols-2">
            <ProductGallery images={product.images} title={product.title} />
            <div>
                <h1 className="font-display text-4xl mb-2">{product.title}</h1>
                <p className="text-lg">${(product.price / 100).toFixed(2)}</p>
                <div className="mt-4 space-y-4">
                    {product.options?.map(opt => (
                        <VariantSelect key={opt.name} name={opt.name} values={opt.values} />
                    ))}
                </div>
                <p className="mt-6 text-ink/80 max-w-prose">{product.summary}</p>
                <div className="mt-6">
                    <AddToCartButton product={product} />
                </div>
            </div>
        </section>
    )
}


function VariantSelect({ name, values }: { name: string; values: string[] }) {
    return (
        <label className="block">
            <span className="font-ui text-sm">{name}</span>
            <select className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-3 py-2">
                {values.map(v => (
                    <option key={v}>{v}</option>
                ))}
            </select>
        </label>
    )
}