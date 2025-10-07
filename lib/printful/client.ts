// server-only
import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';

type PrintfulCatalog = {
  products: Array<{
    id: number;
    name: string;
    variants: number;
    // Not all fields included; we fetch product + variants/details separately
  }>;
};

type PrintfulProduct = {
  id: number;
  name: string;
  variants: Array<{
    id: number;
    name: string;
    sku?: string;
    retail_price?: string; // stringified decimal from Printful
    currency?: string;
    files?: Array<{ type: string; url: string }>;
    color?: string;
    size?: string;
    image?: string;        // sometimes present
  }>;
  // fallback gallery
  files?: Array<{ type: string; url: string }>;
  thumbnail_url?: string;
  // ... other fields
};

const PRINTFUL_API = 'https://api.printful.com';

function getApiKey() {
  const key = process.env.PRINTFUL_API_KEY;
  if (!key) throw new Error('PRINTFUL_API_KEY missing');
  return key;
}

function getCachePath() {
  // Writable both locally and on Vercel at build time
  const p = path.join(process.cwd(), 'src', 'data', 'printful-cache.json');
  return p;
}

async function readCache<T>(): Promise<T | null> {
  try {
    const buf = await fs.readFile(getCachePath(), 'utf8');
    return JSON.parse(buf) as T;
  } catch {
    return null;
  }
}

async function writeCache<T>(data: T) {
  const p = getCachePath();
  const dir = path.dirname(p);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(p, JSON.stringify(data, null, 2), 'utf8');
}

async function pfFetch<T>(endpoint: string, init?: RequestInit, attempt = 0): Promise<T> {
  const res = await fetch(`${PRINTFUL_API}${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    // Important: force server fetch
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

  const json = await res.json();
  // Printful wraps in { result, code } etc
  return (json?.result ?? json) as T;
}

export async function fetchCatalog(): Promise<PrintfulProduct[]> {
  // Strategy: Printful has a "products" list and per-product "variants"
  // We'll fetch the list, then map/fetch details with backoff, then flatten.
  const storeId = process.env.PRINTFUL_STORE_ID?.trim();
  const listEndpoint = storeId ? `/stores/${storeId}/products` : '/store/products';

  const list = await pfFetch<PrintfulCatalog>(listEndpoint);

  // Limit breadth if needed; for M3 pull all (respect rate limits with modest concurrency)
  const concurrency = 4;
  const chunks: number[][] = [];
  for (let i = 0; i < list.products.length; i += concurrency) {
    chunks.push(list.products.slice(i, i + concurrency).map(p => p.id));
  }

  const out: PrintfulProduct[] = [];
  for (const ids of chunks) {
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const p = await pfFetch<PrintfulProduct>(`${listEndpoint}/${id}`);
        return p;
      })
    );
    for (const r of results) {
      if (r.status === 'fulfilled') out.push(r.value);
    }
  }
  return out;
}

export type PrintfulCache = {
  fetchedAt: string;               // ISO
  ttl: number;                     // seconds
  products: PrintfulProduct[];     // normalized source records (pre-map)
};

export async function getPrintfulCached(forceRefresh = false): Promise<PrintfulCache | null> {
  const ttl = Number(process.env.PRINTFUL_CACHE_TTL || '86400');
  const now = Date.now();
  const cached = await readCache<PrintfulCache>();

  if (!forceRefresh && cached) {
    const age = (now - Date.parse(cached.fetchedAt)) / 1000;
    if (age < cached.ttl) return cached;
  }

  try {
    const products = await fetchCatalog();
    const payload: PrintfulCache = {
      fetchedAt: new Date().toISOString(),
      ttl,
      products,
    };
    await writeCache(payload);
    return payload;
  } catch {
    // Fall back to stale cache if present
    if (cached) return cached;
    return null;
  }
}
