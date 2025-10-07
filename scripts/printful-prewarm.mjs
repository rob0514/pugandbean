// Plain Node ESM (no tsx, no TS casts)
import fs from 'node:fs/promises';
import path from 'node:path';

const PRINTFUL_API = 'https://api.printful.com';

function cachePath() {
  return path.join(process.cwd(), 'src', 'data', 'printful-cache.json');
}

async function writeCache(payload) {
  const p = cachePath();
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(payload, null, 2), 'utf8');
}

async function pfFetch(endpoint, attempt = 0) {
  const key = process.env.PRINTFUL_API_KEY;
  if (!key) throw new Error('PRINTFUL_API_KEY missing');

  const res = await fetch(`${PRINTFUL_API}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (res.status === 429 && attempt < 3) {
    const retryAfter = Number(res.headers.get('retry-after') || '1');
    await new Promise(r => setTimeout(r, (retryAfter + attempt) * 1000));
    return pfFetch(endpoint, attempt + 1);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${endpoint} ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json && json.result ? json.result : json;
}

async function fetchCatalog() {
  const storeId = (process.env.PRINTFUL_STORE_ID || '').trim();
  const base = storeId ? `/stores/${storeId}/products` : '/store/products';
  const list = await pfFetch(base); // { products: [...] }

  const ids = Array.isArray(list?.products) ? list.products.map(p => p.id) : [];
  const concurrency = 4;
  const chunks = [];
  for (let i = 0; i < ids.length; i += concurrency) chunks.push(ids.slice(i, i + concurrency));

  const out = [];
  for (const group of chunks) {
    const results = await Promise.allSettled(group.map(id => pfFetch(`${base}/${id}`)));
    for (const r of results) if (r.status === 'fulfilled') out.push(r.value);
  }
  return out;
}

async function main() {
  if ((process.env.DATA_SOURCE || 'mock').trim() !== 'printful') {
    console.log('[printful-prewarm] DATA_SOURCE != printful; skipping.');
    return;
  }

  try {
    const products = await fetchCatalog();
    const ttl = Number(process.env.PRINTFUL_CACHE_TTL || '86400');
    const payload = { fetchedAt: new Date().toISOString(), ttl, products };
    await writeCache(payload);
    console.log(`[printful-prewarm] Cached ${products.length} products.`);
  } catch (e) {
    const msg = e && typeof e === 'object' && 'message' in e ? e.message : String(e);
    console.warn('[printful-prewarm] Failed (non-fatal):', msg);
    console.warn('[printful-prewarm] Build continues; app will use existing cache or empty state.');
  }
}

main();
