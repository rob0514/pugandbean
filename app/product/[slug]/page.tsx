// src/app/(shop)/product/[slug]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductBySlug } from '@/lib/datasource';
import ClientProduct from './ProductClient';

type Params = { slug: string };

// ✅ Next 15 expects params: Promise<...>
export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return notFound();
  return <ClientProduct product={product} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const img = product.images[0];

  return {
    title: `${product.title} – ${product.currency ?? 'USD'} ${product.price.toFixed(2)}`,
    openGraph: {
      title: product.title,
      images: img ? [{ url: img }] : [],
    },
    alternates: { canonical: `/product/${product.slug}` },
  };
}
