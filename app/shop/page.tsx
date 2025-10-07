import { getAllProducts } from '@/lib/datasource';
import type { Product } from '@/types/product';
import { ProductCard } from '@/components/product-card';
import { FiltersBar } from '@/components/filters-bar';

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;

  // ✅ Use datasource (respects DATA_SOURCE and returns canonical Product[])
  const products: Product[] = await getAllProducts();

  const items = products.filter(p => (tag ? p.tags?.includes(tag) : true));
  const tags = Array.from(new Set(products.flatMap(p => p.tags || []))).sort();

  return (
    <section className="px-6 md:px-10 lg:px-16 py-10">
      <h1 className="font-display text-4xl">Shop {process.env.DATA_SOURCE === 'printful' ? '' : '(mock)'}</h1>
      <FiltersBar tags={tags} activeTag={tag} />
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
