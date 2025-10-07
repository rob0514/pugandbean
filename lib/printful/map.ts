import type { Product, Variant, ProductOption } from '@/types/product';

type PFVariant = {
  id: number;
  name: string;
  sku?: string;
  retail_price?: string;
  currency?: string;
  files?: Array<{ type: string; url: string }>;
  color?: string;
  size?: string;
  image?: string;
};

type PFProduct = {
  id: number;
  name: string;
  variants: PFVariant[];
  files?: Array<{ type: string; url: string }>;
  thumbnail_url?: string;
};

function toNum(n?: string) {
  const v = n ? Number.parseFloat(n) : 0;
  return Number.isFinite(v) ? v : 0;
}
function kebab(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
export function pfSlug(p: PFProduct) {
  return `${kebab(p.name)}-pf${p.id}`;
}

export function fromPrintfulVariant(v: PFVariant, fallbackCurrency: string): Variant {
  const parts = [v.color, v.size].filter(Boolean) as string[];
  return {
    id: `pfv:${v.id}`,
    sku: v.sku,
    title: parts.join(' / ') || v.name,
    options: {
      ...(v.color ? { color: v.color } : {}),
      ...(v.size ? { size: v.size } : {}),
    },
    price: toNum(v.retail_price),
    image: v.image,
    currency: v.currency || fallbackCurrency,
  };
}

export function fromPrintful(p: PFProduct): Product {
  const currency = p.variants.find(v => v.currency)?.currency || 'USD';
  const variants = p.variants.map(v => fromPrintfulVariant(v, currency));

  // derive options
  const map = new Map<string, Set<string>>();
  for (const v of variants) {
    for (const [k, val] of Object.entries(v.options)) {
      if (!map.has(k)) map.set(k, new Set());
      map.get(k)!.add(val);
    }
  }
  const options: ProductOption[] = Array.from(map.entries()).map(([id, set]) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    values: Array.from(set),
  }));

  const images: string[] = [
    ...(p.files?.map(f => f.url) ?? []),
    ...(p.variants?.map(v => v.image).filter(Boolean) as string[]),
    ...(p.thumbnail_url ? [p.thumbnail_url] : []),
  ].filter(Boolean);

  const basePrice = variants.length
    ? Math.min(...variants.map(v => v.price || Number.POSITIVE_INFINITY))
    : 0;

  return {
    id: `pf:${p.id}`,
    slug: pfSlug(p),
    title: p.name,
    price: Number.isFinite(basePrice) ? basePrice : 0,
    currency,
    images,
    options,
    variants,
    tags: [],
  };
}
