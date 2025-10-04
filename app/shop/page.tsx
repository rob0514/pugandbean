import products from '@/data/products.json'
import { ProductCard } from '@/components/product-card'
import { FiltersBar } from '@/components/filters-bar'
import { type Product } from '@/types/product'

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>
}) {
  const { tag } = await searchParams

  const items = (products as Product[]).filter(p => (tag ? p.tags?.includes(tag) : true))
  const tags = Array.from(new Set((products as Product[]).flatMap(p => p.tags || []))).sort()

  return (
    <section className="px-6 md:px-10 lg:px-16 py-10">
      <h1 className="font-display text-4xl">Shop (mock)</h1>
      <FiltersBar tags={tags} activeTag={tag} />
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
