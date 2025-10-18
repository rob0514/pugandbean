// lib/datasource.impl.ts
// NOTE: no `import "server-only"` here
import type { Product, Variant, ProductOption } from "@/types/product";

// Adjust path if yours differs
import mockJson from "@/data/products.json" assert { type: "json" };

const SOURCE = (process.env.DATA_SOURCE ?? "mock").trim();

/* -------------------------- Mock JSON types -------------------------- */
type MockJsonProduct = {
  id: string;
  slug: string;
  title: string;
  price: number | string;
  currency?: string;
  images: string[];
  summary?: string;
  descriptionMdxPath?: string;
  tags?: string[];
  options?: Array<{ id?: string; name: string; values: string[] }>;
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
type MockJsonWrapped = { products: MockJsonProduct[] };

/* -------------------------- Helpers -------------------------- */
function toNum(n: number | string | undefined): number {
  if (typeof n === "number") return n;
  if (typeof n === "string") {
    const v = Number.parseFloat(n);
    return Number.isFinite(v) ? v : 0;
  }
  return 0;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function buildOptionMaps(opts: Array<{ name: string; values: string[] }>) {
  const nameToId = new Map<string, string>();
  const normalized = opts.map((o, idx) => {
    const id = `${slugify(o.name)}-${idx}`; // e.g., "size-0", "color-1"
    nameToId.set(o.name, id);
    return { id, name: o.name, values: o.values };
  });
  return { normalized, nameToId };
}

function convertVariantOptionKeys(
  vOpts: Record<string, string> | undefined,
  nameToId: Map<string, string>
) {
  if (!vOpts) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(vOpts)) {
    const id = nameToId.get(k) ?? slugify(k); // fall back if unexpected name
    out[id] = v;
  }
  return out;
}

function variantTitle(vOpts: Record<string, string>) {
  const vals = Object.values(vOpts).filter(Boolean);
  return vals.length ? vals.join(" / ") : "Default";
}



/* Normalize ProductOption[]: ensure id is present */
function _normalizeOptions(opts: NonNullable<MockJsonProduct["options"]>): ProductOption[] {
  return opts.map((o, idx) => ({
    id: o.id ?? `${slugify(o.name)}-${idx}`,
    name: o.name,
    values: o.values,
  }));
}

function variantTitleFromOptions(vOpts?: Record<string, string>): string {
  if (!vOpts) return "Default";
  const vals = Object.values(vOpts).filter(Boolean);
  return vals.length ? vals.join(" / ") : "Default";
}

function _mapVariant(v: NonNullable<MockJsonProduct["variants"]>[number], fallbackPrice: number): Variant {
  return {
    id: v.id,
    sku: v.sku,
    title: v.title ?? variantTitleFromOptions(v.options),
    options: v.options ?? {},
    price: toNum(v.price ?? fallbackPrice),
    image: v.image,
    currency: (v.currency ?? "USD"),
  };
}

function isMockArray(x: unknown): x is MockJsonProduct[] {
  return Array.isArray(x);
}

function isMockWrapped(x: unknown): x is MockJsonWrapped {
  return typeof x === "object" && x !== null && Array.isArray((x as { products?: unknown }).products);
}

/* Main mock normalizer */
function normalizeMockProduct(p: MockJsonProduct): Product {
  const currency = (p.currency ?? "USD");
  // 1) normalize options and build name→id map
  const { normalized: options, nameToId } = buildOptionMaps(p.options ?? []);

  // 2) map variants: re-key options to use the normalized option ids
  const variants: Variant[] = (p.variants ?? []).map((v) => {
    const vOpts = convertVariantOptionKeys(v.options, nameToId); // keys now "size-0", "color-1"
    const id = (v.id) ?? (Object.values(vOpts).map(slugify).join("-") || "default");
    const priceNum = toNum(v.price ?? p.price);
    return {
      id,
      sku: v.sku,
      title: v.title ?? variantTitle(vOpts),
      options: vOpts,                 // ✅ keys align with options[].id
      price: priceNum,
      image: v.image,
      currency,
    };
  });

  // 3) derive options if JSON omitted them
  const finalOptions =
    options.length ? options :
    (() => {
      const map = new Map<string, Set<string>>();
      for (const v of variants) {
        for (const [k, val] of Object.entries(v.options)) {
          if (!map.has(k)) map.set(k, new Set());
          map.get(k)!.add(val);
        }
      }
      return Array.from(map.entries()).map(([id, set]) => ({
        id,
        name: id.split("-")[0].replace(/^\w/, (c) => c.toUpperCase()),
        values: Array.from(set),
      }));
    })();

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    descriptionMdxPath: p.descriptionMdxPath,
    price: toNum(p.price),
    currency,
    images: Array.isArray(p.images) ? p.images : [],
    options: finalOptions,
    variants,
    tags: p.tags ?? [],
  };
}

function getAllProductsFromMock(): Product[] {
  const raw: unknown = mockJson;
  const arr: MockJsonProduct[] = isMockArray(raw) ? raw : isMockWrapped(raw) ? raw.products : [];
  return arr.map(normalizeMockProduct);
}

/* -------------------------- Public API -------------------------- */
export async function getAllProducts(): Promise<Product[]> {
  if (SOURCE === "printful") {
    // Lazy-load server-only modules to avoid `server-only` in script runtime
    const [{ getPrintfulCached }, { fromPrintful }] = await Promise.all([
      import("@/lib/printful/client"), // in app: this file has `server-only`, fine; in scripts: don’t set DATA_SOURCE=printful
      import("@/lib/printful/map"),
    ]);
    const cache = await getPrintfulCached();
    if (!cache) return [];
    // If your mapper exports { product }, use:  cache.products.map(fromPrintful.product)
    return cache.products.map(fromPrintful);
  }
  return getAllProductsFromMock();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const list = await getAllProducts();
  return list.find((p) => p.slug === slug) ?? null;
}
