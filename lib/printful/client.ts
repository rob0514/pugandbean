// src/lib/printful/client.ts
import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from "zod";

const PrintfulEnvelope = z.object({
  code: z.number(),
  result: z.unknown(), // if you know the shape, replace with a typed schema
});

type PrintfulEnvelope = z.infer<typeof PrintfulEnvelope>;
// -----------------------------
// Public types (used by map.ts)
// -----------------------------
export type PrintfulVariant = {
  id: number;
  name: string;
  sku?: string;
  retail_price?: string;
  currency?: string;
  color?: string;
  size?: string;
  image?: string;
};

export type PrintfulProduct = {
  id: number;
  name: string;
  variants: PrintfulVariant[];
  files?: Array<{ type?: string; url: string }>;
  thumbnail_url?: string;
};

// cache payload
type PrintfulCache = {
  fetchedAt: string;
  ttl: number;
  products: PrintfulProduct[];
};

// ---------------------------------
// Config / helpers (no `any` casts)
// ---------------------------------
const PRINTFUL_API = 'https://api.printful.com';

function getApiKey(): string {
  const key = process.env.PRINTFUL_API_KEY?.trim();
  if (!key) throw new Error('PRINTFUL_API_KEY missing');
  return key;
}

function isTrue(v: string | undefined) {
  return typeof v === 'string' && /^(1|true|yes|on)$/i.test(v.trim());
}

function normalizeHeaders(h?: HeadersInit): Record<string, string> {
  if (!h) return {};
  if (Array.isArray(h)) return Object.fromEntries(h as Array<[string, string]>);
  if (typeof Headers !== 'undefined' && h instanceof Headers) {
    const out: Record<string, string> = {};
    h.forEach((v, k) => { out[k] = v; });
    return out;
  }
  return h as Record<string, string>;
}

async function pfFetch<T>(endpoint: string, init: RequestInit = {}, attempt = 0): Promise<T> {
  const storeId = (process.env.PRINTFUL_STORE_ID || '').trim();

  // base headers (store header ONLY for /store/* endpoints)
  const baseHeaders: Record<string, string> = {
    Authorization: `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
    ...(endpoint.startsWith('/store/') && storeId ? { 'X-PF-Store-ID': storeId } : {}),
  };

  const headers: Record<string, string> = {
    ...normalizeHeaders(init.headers),
    ...baseHeaders, // base wins
  };

  const res = await fetch(`${PRINTFUL_API}${endpoint}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (res.status === 429 && attempt < 3) {
    const retryAfter = Number(res.headers.get('retry-after') || '1');
    await new Promise(r => setTimeout(r, (retryAfter + attempt) * 1000));
    return pfFetch<T>(endpoint, init, attempt + 1);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Printful ${endpoint} ${res.status}: ${text}`);
  }

  /*const json = await res.json();
  // Printful wraps payloads in { result } — unwrap if present
  return (json?.result ?? json) as T;*/
  const jsonUnknown: unknown = await res.json();
  const json = PrintfulEnvelope.parse(jsonUnknown);
  return (json?.result ?? json) as T; // unknown until you parse a concrete schema
}

// ---------------------------
// Disk cache (two locations)
// ---------------------------
function cachePaths(): string[] {
  const cwd = process.cwd();
  return [
    path.join(cwd, 'data', 'printful-cache.json'),
    path.join(cwd, '.next', 'cache', 'printful-cache.json'),
  ];
}

async function readFirstExisting<T>(): Promise<T | null> {
  for (const p of cachePaths()) {
    try {
      const txt = await fs.readFile(p, 'utf8');
      return JSON.parse(txt) as T;
    } catch {
      // continue
    }
  }
  return null;
}

async function writeEverywhere<T>(payload: T): Promise<void> {
  await Promise.all(
    cachePaths().map(async p => {
      try {
        await fs.mkdir(path.dirname(p), { recursive: true });
        await fs.writeFile(p, JSON.stringify(payload, null, 2), 'utf8');
      } catch {
        // non-fatal
      }
    })
  );
}

// -----------------------------------------------------------
// Fetch catalog (STORE mode by default) with optional enrich
// -----------------------------------------------------------
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
  return list.paging;
}

type StoreVariantBase = {
  id: number;
  name: string;
  sku?: string;
  retail_price?: string;
  currency?: string;
  color?: string;
  size?: string;
  image?: string;
};
type StoreVariantWithCatalog = StoreVariantBase & { _catalogVariantId: number };

export async function fetchCatalog(): Promise<PrintfulProduct[]> {
  const storeId = (process.env.PRINTFUL_STORE_ID || '').trim();
  const listBase = storeId ? '/store/products' : '/products';

  // list all ids (cap to something reasonable if needed in future)
  const limit = 100;
  let offset = 0;
  const ids: number[] = [];
  for (;;) {
    const q = `${listBase}?limit=${limit}&offset=${offset}`;
    const page = await pfFetch<unknown>(q);
    const items = extractItems(page);
    ids.push(...items.map(p => p.id));
    const paging = extractPaging(page);
    const total = paging?.total;
    offset += limit;
    if (!items.length) break;
    if (typeof total === 'number' && ids.length >= total) break;
  }

  const out: PrintfulProduct[] = [];
  const concurrency = 6;

  // Catalog mode: details already look like PrintfulProduct
  if (!storeId) {
    for (let i = 0; i < ids.length; i += concurrency) {
      const chunk = ids.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        chunk.map(id => pfFetch<PrintfulProduct>(`${listBase}/${id}`))
      );
      for (const r of results) if (r.status === 'fulfilled') out.push(r.value);
    }
    return out;
  }

  // Store mode: normalize { sync_product, sync_variants } → PrintfulProduct-like
  for (let i = 0; i < ids.length; i += concurrency) {
    const chunk = ids.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      chunk.map(id =>
        pfFetch<{
          sync_product: { id: number; name: string; thumbnail_url?: string };
          sync_variants: Array<{
            id: number;
            variant_id: number;
            name: string;
            retail_price?: string;
            currency?: string;
            files?: Array<{ preview_url?: string; url?: string }>;
          }>;
        }>(`${listBase}/${id}`)
      )
    );

    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      const d = r.value;

      const raw = Array.isArray(d.sync_variants) ? d.sync_variants : [];
      const baseVariants: StoreVariantWithCatalog[] = raw.map(sv => {
        const f0 = Array.isArray(sv.files) && sv.files.length ? sv.files[0] : undefined;
        const image = f0?.preview_url || f0?.url;
        return {
          id: sv.id,
          name: sv.name,
          sku: undefined,
          retail_price: sv.retail_price,
          currency: sv.currency,
          color: undefined,
          size: undefined,
          image,
          _catalogVariantId: sv.variant_id,
        };
      });

      // Start with stripped variants (no _catalogVariantId)
      let enriched: StoreVariantBase[] = baseVariants.map((v) => ({
  id: v.id,
  name: v.name,
  sku: v.sku,
  retail_price: v.retail_price,
  currency: v.currency,
  color: v.color,
  size: v.size,
  image: v.image,
}));
      // Optional enrichment using global catalog /products/variant/{id}
      if (isTrue(process.env.PRINTFUL_ENRICH_VARIANTS)) {
        const max = Math.max(1, Math.min(Number(process.env.PRINTFUL_ENRICH_MAX || '200'), 1000));
        const targets = baseVariants
          .filter(v => Number.isFinite(v._catalogVariantId))
          .slice(0, max);

        const enrichMap = new Map<number, { color?: string; size?: string; image?: string }>();
        const enrichConcurrency = 10;

        for (let j = 0; j < targets.length; j += enrichConcurrency) {
          const slice = targets.slice(j, j + enrichConcurrency);
          const results2 = await Promise.allSettled(
            slice.map(v => pfFetch<{
              variant?: { id?: number; name?: string; size?: string; color?: string; image?: string };
              product?: { size?: string; color?: string; image?: string };
              files?: Array<{ url?: string }>;
            }>(`/products/variant/${v._catalogVariantId}`))
          );
          results2.forEach((rr, idx) => {
            if (rr.status !== 'fulfilled') return;
            const payload = rr.value;
            const vdetail = payload.variant ?? payload.product ?? {};
            const files = Array.isArray(payload.files) ? payload.files : [];
            const primaryImage = vdetail.image || (files.length ? files[0]?.url : undefined);
            const entry = {
              color: typeof vdetail.color === 'string' ? vdetail.color : undefined,
              size: typeof vdetail.size === 'string' ? vdetail.size : undefined,
              image: typeof primaryImage === 'string' ? primaryImage : undefined,
            };
            const idKey = targets[idx]._catalogVariantId;
            enrichMap.set(idKey, entry);
          });
        }

 enriched = baseVariants.map((v) => {
  const add = enrichMap.get(v._catalogVariantId);
  return {
    id: v.id,
    name: v.name,
    sku: v.sku,
    retail_price: v.retail_price,
    currency: v.currency,
    color: add?.color ?? v.color,
    size: add?.size ?? v.size,
    image: add?.image ?? v.image,
  };
});
      }

      out.push({
        id: d.sync_product.id,
        name: d.sync_product.name,
        variants: enriched,
        files: [], // images live on variants
        thumbnail_url: d.sync_product.thumbnail_url,
      });
    }
  }

  return out;
}

// ----------------------------------------------------
// Public: get cached (or fetch+cache) Printful catalog
// ----------------------------------------------------
export async function getPrintfulCached(): Promise<PrintfulCache | null> {
  const ttl = Number(process.env.PRINTFUL_CACHE_TTL || '86400');
  const now = Date.now();

  // 1) try disk cache
  const cached = await readFirstExisting<PrintfulCache>();
  if (cached) {
    const age = now - Date.parse(cached.fetchedAt);
    if (Number.isFinite(age) && age < ttl * 1000 && Array.isArray(cached.products) && cached.products.length) {
      return cached;
    }
  }

  // 2) fetch live (build/revalidate) — never throw; fall back to stale/empty
  try {
    const products = await fetchCatalog();
    const payload: PrintfulCache = {
      fetchedAt: new Date().toISOString(),
      ttl,
      products,
    };
    await writeEverywhere(payload);
    return payload;
  } catch {
    // Fall back to whatever we had
    if (cached) return cached;
    return { fetchedAt: new Date(0).toISOString(), ttl, products: [] };
  }
}
