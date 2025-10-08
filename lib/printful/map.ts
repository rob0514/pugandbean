//import type { Product, Variant, ProductOption } from '@/types/product';
import type { Product, Variant, ProductOption } from '@/types/product';
import type { PrintfulProduct, PrintfulVariant } from '@/lib/printful/client';

/*type PFVariant = {
  id: number;
  name: string;
  sku?: string;
  retail_price?: string;
  currency?: string;
  files?: Array<{ type: string; url: string }>;
  color?: string;
  size?: string;
  image?: string;
};*/

/*type PFProduct = {
  id: number;
  name: string;
  variants: PFVariant[];
  files?: Array<{ type: string; url: string }>;
  thumbnail_url?: string;
};*/

/*function toNum(n?: string) {
  const v = n ? Number.parseFloat(n) : 0;
  return Number.isFinite(v) ? v : 0;
}
function kebab(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
export function pfSlug(p: PFProduct) {
  return `${kebab(p.name)}-pf${p.id}`;
}*/

const SIZE_TOKENS = new Set([
  'xs','s','m','l','xl','2xl','3xl','4xl','5xl',
  'x-small','small','medium','large','x-large'
]);

function isSizeToken(s: string) {
  const t = s.trim().toLowerCase();
  if (SIZE_TOKENS.has(t)) return true;
  if (/^\d{2,3}[a-z]?$/.test(t)) return true;     // 28, 30, 32, 32w, etc.
  if (/^\d+x\d+(\.\d+)?$/.test(t)) return true;   // 8x10, 12x18
  return false;
}

function parseOptionsFromName(name: string): Record<string, string> {
  // Handle common patterns: "Black / M", "M - Black", "Black-M", "Black | M"
  const parts = name.split(/[\/|\-\u00b7|⋅|•|,]/).map(s => s.trim()).filter(Boolean);
  if (parts.length < 2) return {};
  let color: string | undefined;
  let size: string | undefined;

  for (const p of parts) {
    if (!size && isSizeToken(p)) size = p;
    else if (!color) color = p;
  }

  const out: Record<string, string> = {};
  if (color) out.color = color;
  if (size) out.size = size;
  return out;
}

function toPrice(n?: string) {
  const v = n ? Number.parseFloat(n) : 0;
  return Number.isFinite(v) ? v : 0;
}

export function fromPrintfulVariant(v: PrintfulVariant, fallbackCurrency: string): Variant {
  // Prefer explicit fields; otherwise try to parse from name
  const parsed = (!v.color && !v.size) ? parseOptionsFromName(v.name) : {};
  const color = v.color ?? parsed.color;
  const size  = v.size  ?? parsed.size;

  const title = [color, size].filter(Boolean).join(' / ') || v.name;

  return {
    id: `pfv:${v.id}`,
    sku: v.sku,
    title,
    options: {
      ...(color ? { color } : {}),
      ...(size  ? { size }  : {}),
    },
    price: toPrice(v.retail_price),
    image: v.image,
    currency: v.currency || fallbackCurrency,
  };
}


export function fromPrintful(p: PrintfulProduct): Product {
  const currency = p.variants.find(v => v.currency)?.currency || 'USD';
  const variants = p.variants.map(v => fromPrintfulVariant(v, currency));

  // Build options from the variants we just created
  const optMap = new Map<string, Set<string>>();
  for (const v of variants) {
    for (const [k, val] of Object.entries(v.options)) {
      if (!optMap.has(k)) optMap.set(k, new Set());
      optMap.get(k)!.add(val);
    }
  }
  const options: ProductOption[] = Array.from(optMap.entries()).map(([id, set]) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    values: Array.from(set),
  }));

  const fileUrls = Array.isArray(p.files) ? p.files.map(f => f.url) : [];
  const variantImgs = p.variants.map(v => v.image).filter((u): u is string => Boolean(u));
  const thumb = p.thumbnail_url ? [p.thumbnail_url] : [];
  const images = [...fileUrls, ...variantImgs, ...thumb];

  const basePrice = variants.length
    ? Math.min(...variants.map(v => v.price || Number.POSITIVE_INFINITY))
    : 0;

  const slug = `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-pf${p.id}`;

  return {
    id: `pf:${p.id}`,
    slug,
    title: p.name,
    price: Number.isFinite(basePrice) ? basePrice : 0,
    currency,
    images,
    options,
    variants,
    tags: [],
  };
}