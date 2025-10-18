import { NextResponse } from 'next/server';
import { z } from "zod";
// Disable caching so you always see fresh results
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PRINTFUL_API = 'https://api.printful.com';

const PrintfulEnvelope = z.object({
  code: z.number(),
  result: z.unknown(), // if you know the shape, replace with a typed schema
});

type PrintfulEnvelope = z.infer<typeof PrintfulEnvelope>;

function requireKey() {
    const key = process.env.PRINTFUL_API_KEY;
    if (!key) throw new Error('PRINTFUL_API_KEY is missing');
    return key;
}

/*function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e && 'message' in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return String(e);
}*/

function storeHeaders(storeId?: string): Record<string, string> {
    return storeId ? { 'X-PF-Store-ID': storeId } : {};
}

async function pfFetch<T>(endpoint: string, storeId?: string, attempt = 0): Promise<T> {
    const res = await fetch(`${PRINTFUL_API}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${requireKey()}`,
            'Content-Type': 'application/json',
            ...storeHeaders(storeId),
        },
        cache: 'no-store',
    });

    if (res.status === 429 && attempt < 3) {
        const retryAfter = Number(res.headers.get('retry-after') || '1');
        await new Promise(r => setTimeout(r, (retryAfter + attempt) * 1000));
        return pfFetch<T>(endpoint, storeId, attempt + 1);
    }

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`${endpoint} ${res.status}: ${text}`);
    }

    /* const json = await res.json();
    // Printful responses are usually { code, result, paging? }
    return (json?.result ?? json) as T;*/
    const dataUnknown: unknown = await res.json();
    const data = PrintfulEnvelope.parse(dataUnknown);
    // Printful responses are usually { code, result, paging? }
    return (data?.result ?? data) as T;
}

//type ListResult = { products: Array<{ id: number }>; paging?: { total: number; offset: number; limit: number } };

// Pull ALL product ids with pagination
// --- Types for both modes ---
type PFVariant = {
  id: number;
  name: string;
  sku?: string;
  retail_price?: string;
  currency?: string;
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

// Store detail: { sync_product, sync_variants }
type PFStoreFile = { type?: string; preview_url?: string; url?: string };
type PFStoreVariant = {
  id: number;                 // sync variant id
  variant_id: number;         // catalog variant id
  name: string;
  retail_price?: string;
  currency?: string;
  files?: PFStoreFile[];
};
type PFStoreProductDetail = {
  sync_product: { id: number; name: string; thumbnail_url?: string };
  sync_variants: PFStoreVariant[];
};

// Catalog detail is already PFProduct-like
type PFCatalogProductDetail = PFProduct;

// Helpers to coerce possibly-undefined arrays to arrays
function arr<T>(x: T[] | undefined | null): T[] {
  return Array.isArray(x) ? x : [];
}

// ---------- DETAIL FETCH ----------
async function getAllDetails(ids: number[], storeId?: string): Promise<PFProduct[]> {
  if (!ids.length) return [];
  const out: PFProduct[] = [];
  const concurrency = 6;

  if (!storeId) {
    // Catalog mode: /products/{id} returns variants with color/size/image
    const base = '/products';
    for (let i = 0; i < ids.length; i += concurrency) {
      const chunk = ids.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        chunk.map(id => pfFetch<PFCatalogProductDetail>(`${base}/${id}`))
      );
      for (const r of results) if (r.status === 'fulfilled') out.push(r.value);
    }
    return out;
  }

  // Store mode: /store/products/{id} returns { sync_product, sync_variants }
  const base = '/store/products';
  for (let i = 0; i < ids.length; i += concurrency) {
    const chunk = ids.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      chunk.map(id => pfFetch<PFStoreProductDetail>(`${base}/${id}`, storeId))
    );
    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      const d = r.value;
      const product: PFProduct = {
        id: d.sync_product.id,
        name: d.sync_product.name,
        thumbnail_url: d.sync_product.thumbnail_url,
        files: [], // store detail doesn't return product-level files; variants have files
        variants: arr(d.sync_variants).map((sv): PFVariant => {
          // Prefer preview_url, fall back to url if present
          const firstFile = arr(sv.files)[0];
          const image =
            (firstFile && (firstFile.preview_url || firstFile.url)) || undefined;
          return {
            id: sv.id,
            name: sv.name,
            sku: undefined,
            retail_price: sv.retail_price,
            currency: sv.currency,
            // store detail doesn't include color/size; we'd need another call to catalog /products/variant/{variant_id}
            color: undefined,
            size: undefined,
            image,
          };
        }),
      };
      out.push(product);
    }
  }
  return out;
}

// ---------- LIST WITH PAGINATION ----------
type IdItem = { id: number };
type Paging = { total?: number; offset?: number; limit?: number };
type ProductListObj = { products: IdItem[]; paging?: Paging };

function hasProductsObj(x: unknown): x is ProductListObj {
  if (typeof x !== 'object' || x === null) return false;
  const maybe = x as Record<string, unknown>;
  return Array.isArray(maybe.products);
}
function isIdItemArray(x: unknown): x is IdItem[] {
  return Array.isArray(x) && x.every(it => typeof (it as IdItem).id === 'number');
}

function extractItems(list: unknown): IdItem[] {
  if (isIdItemArray(list)) return list;
  if (hasProductsObj(list)) return list.products;
  return [];
}
function extractPaging(list: unknown): Paging | undefined {
  if (!hasProductsObj(list)) return undefined;
  const p = list.paging;
  return p && typeof p === 'object' ? (p as Paging) : undefined;
}

// Pull ALL product ids with pagination
async function listAllProductIds(storeId?: string): Promise<number[]> {
  const base = storeId ? '/store/products' : '/products';
  const limit = 100;
  let offset = 0;
  const ids: number[] = [];

  for (;;) {
    const q = `${base}?limit=${limit}&offset=${offset}`;
    const page = await pfFetch<unknown>(q, storeId);

    const items = extractItems(page);
    ids.push(...items.map(p => p.id));

    const paging = extractPaging(page);
    const total = paging?.total;

    offset += limit;
    if (!items.length) break;
    if (typeof total === 'number' && ids.length >= total) break;
  }
  return ids;
}

// ---------- GET ----------
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const storeId = (url.searchParams.get('id') || '').trim() || undefined;

    const mode = storeId ? 'store' : 'catalog';
    const ids = await listAllProductIds(storeId);
    const details = await getAllDetails(ids, storeId);

    // Build a compact, safe sample
    const sample = details.slice(0, 3).map(p => {
      const variantImgs = arr(p.variants).map(v => v.image).filter((u): u is string => Boolean(u));
      const thumb = p.thumbnail_url ? [p.thumbnail_url] : [];
      const images = [...variantImgs, ...thumb].slice(0, 4);

      return {
        id: p.id,
        name: p.name,
        variants: arr(p.variants).slice(0, 3).map(v => ({
          id: v.id,
          title: v.name,
          price: v.retail_price,
          currency: v.currency,
          color: v.color,
          size: v.size,
        })),
        images,
      };
    });

    return NextResponse.json({
      ok: true,
      mode,
      storeId: storeId ?? null,
      count: details.length,
      idCount: ids.length,
      sample,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
