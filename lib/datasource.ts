import 'server-only';
import type { Product, Variant, ProductOption } from '@/types/product';
import { getPrintfulCached } from '@/lib/printful/client';
import { fromPrintful } from '@/lib/printful/map';

// Adjust path if yours differs
import mockJson from '@/data/products.json' assert { type: 'json' };

const SOURCE = (process.env.DATA_SOURCE || 'mock').trim();

// ----- Mock JSON → Product (legacy) -----
type MockJsonProduct = {
  id: string;
  slug: string;
  title: string;
  price: number | string;
  currency?: string;
  images: Array<string>;
  summary?: string;
  descriptionMdxPath?: string;
  tags?: string[];
  options?: Array<{ id: string; name: string; values: string[] }>;
  variants?: Array<{
    id: string;
    sku?: string;
    title?: string;
    options?: Record<string, string>;
    price?: number | string;
    image?: string;
    currency?: string;
  }>;
};

function toNum(n: number | string | undefined): number {
  if (typeof n === 'number') return n;
  if (typeof n === 'string') {
    const v = Number.parseFloat(n);
    return Number.isFinite(v) ? v : 0;
  }
  return 0;
}

function normalizeMockProduct(p: MockJsonProduct): Product {
  const currency = p.currency || 'USD';

  const variants: Variant[] = (p.variants || []).map(v => ({
    id: v.id,
    sku: v.sku,
    title: v.title || Object.values(v.options || {}).join(' / ') || 'Default',
    options: v.options || {},
    price: toNum(v.price ?? p.price),
    image: v.image,
    currency: v.currency || currency,
  }));

  // If options not provided, derive from variants
  let options: ProductOption[] = p.options || [];
  if (!options.length && variants.length) {
    const map = new Map<string, Set<string>>();
    for (const v of variants) {
      for (const [k, val] of Object.entries(v.options)) {
        if (!map.has(k)) map.set(k, new Set());
        map.get(k)!.add(val);
      }
    }
    options = Array.from(map.entries()).map(([id, set]) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      values: Array.from(set),
    }));
  }

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    descriptionMdxPath: p.descriptionMdxPath,
    price: toNum(p.price),
    currency,
    images: Array.isArray(p.images) ? p.images : [],
    options,
    variants,
    tags: p.tags || [],
  };
}

type MockJsonWrapped = { products: MockJsonProduct[] };

function isMockArray(x: unknown): x is MockJsonProduct[] {
  return Array.isArray(x);
}

function isMockWrapped(x: unknown): x is MockJsonWrapped {
  return typeof x === 'object' &&
    x !== null &&
    Array.isArray((x as { products?: unknown }).products);
}

function getAllProductsFromMock(): Product[] {
  const raw: unknown = mockJson;

  let arr: MockJsonProduct[] = [];
  if (isMockArray(raw)) {
    arr = raw;
  } else if (isMockWrapped(raw)) {
    arr = raw.products;
  } else {
    // Unknown JSON shape → return empty to stay resilient
    return [];
  }

  return arr.map(normalizeMockProduct);
}

// ----- Public API -----
export async function getAllProducts(): Promise<Product[]> {
  if (SOURCE === 'printful') {
    const cache = await getPrintfulCached();
    if (!cache) return [];
    // Use mapper in map.ts (see file 3)
    return cache.products.map(fromPrintful);
  }
  return getAllProductsFromMock();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const list = await getAllProducts();
  return list.find(p => p.slug === slug) ?? null;
}
