// scripts/printful-prewarm.mjs
import fs from 'node:fs/promises';
import fss from 'node:fs';
import path from 'node:path';

function toInt(val, def) {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

// ------------ dotenv (no dependency) ------------
function loadDotenv() {
  const cwd = process.cwd();
  for (const file of [path.join(cwd, '.env.local'), path.join(cwd, '.env')]) {
    if (!fss.existsSync(file)) continue;
    const lines = fss.readFileSync(file, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      if (!line || line.trim().startsWith('#')) continue;
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const key = m[1];
      let val = m[2].replace(/^['"]|['"]$/g, '');
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}
loadDotenv();

const API = 'https://api.printful.com';

function isTrue(v) {
  return typeof v === 'string' && /^(1|true|yes|on)$/i.test(v.trim());
}
function mask(s) {
  return !s ? '' : s.length <= 6 ? '*'.repeat(s.length) : `${s.slice(0, 3)}***${s.slice(-3)}`;
}

function cachePaths() {
  const cwd = process.cwd();
  return [
    path.join(cwd, 'data', 'printful-cache.json'),
    path.join(cwd, '.next', 'cache', 'printful-cache.json'),
  ];
}
async function writeEverywhere(payload) {
  for (const p of cachePaths()) {
    try {
      await fs.mkdir(path.dirname(p), { recursive: true });
      await fs.writeFile(p, JSON.stringify(payload, null, 2), 'utf8');
    } catch {}
  }
}

async function pfFetch(endpoint, { useStoreHeader = false } = {}, attempt = 0) {
  const key = process.env.PRINTFUL_API_KEY;
  if (!key) throw new Error('PRINTFUL_API_KEY missing');

  const headers = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(useStoreHeader && process.env.PRINTFUL_STORE_ID
      ? { 'X-PF-Store-ID': String(process.env.PRINTFUL_STORE_ID).trim() }
      : {}),
  };

  const res = await fetch(`${API}${endpoint}`, { headers, cache: 'no-store' });

  if (res.status === 429 && attempt < 3) {
    const retryAfter = Number(res.headers.get('retry-after') || '1');
    await new Promise(r => setTimeout(r, (retryAfter + attempt) * 1000));
    return pfFetch(endpoint, { useStoreHeader }, attempt + 1);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${endpoint} ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json && json.result ? json.result : json;
}

// ----------------- Fetch store catalog (+ enrichment) -----------------
async function fetchStoreProducts() {
  const base = '/store/products';

  // list all ids (with pagination)
  const ids = [];
  const limit = 100;
  let offset = 0;
  for (;;) {
    const page = await pfFetch(`${base}?limit=${limit}&offset=${offset}`, { useStoreHeader: true });
    const items = Array.isArray(page)
      ? page
      : page && Array.isArray(page.products)
      ? page.products
      : [];
    if (!items.length) break;
    for (const it of items) ids.push(it.id);
    const paging = page && page.paging;
    offset += limit;
    if (paging && typeof paging.total === 'number' && ids.length >= paging.total) break;
  }

  // detail requests
  const out = [];
  const concurrency = 6;
  for (let i = 0; i < ids.length; i += concurrency) {
    const chunk = ids.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      chunk.map(id => pfFetch(`${base}/${id}`, { useStoreHeader: true }))
    );
    for (const r of results) if (r.status === 'fulfilled') out.push(r.value);
  }

  // normalize to product-like objects
  const normalized = out.map(d => {
    const sp = d.sync_product;
    const sv = Array.isArray(d.sync_variants) ? d.sync_variants : [];
    return {
      id: sp.id,
      name: sp.name,
      variants: sv.map(v => {
        const f0 = Array.isArray(v.files) && v.files.length ? v.files[0] : undefined;
        return {
          id: v.id,
          name: v.name,
          retail_price: v.retail_price,
          currency: v.currency,
          color: undefined,
          size: undefined,
          image: f0?.preview_url || f0?.url,
          _catalogVariantId: v.variant_id, // temp for enrichment
        };
      }),
      files: [],
      thumbnail_url: sp.thumbnail_url,
    };
  });

  // optional enrichment from catalog /products/variant/{id}
  const enrichOn  = isTrue(process.env.PRINTFUL_ENRICH_VARIANTS);
  const enrichMax = toInt(process.env.PRINTFUL_ENRICH_MAX, 200); // <-- robust default
  let enrichedCount = 0;

  if (enrichOn) {
    const allTargets = normalized.flatMap(p => p.variants.map(v => v._catalogVariantId).filter(Boolean));
    const uniqueTargets = Array.from(new Set(allTargets
  .map(id => Number(id))
  .filter(n => Number.isFinite(n))
)).slice(0, enrichMax);

    const enrichMap = new Map();
    const eConc = 10;
    for (let i = 0; i < uniqueTargets.length; i += eConc) {
      const slice = uniqueTargets.slice(i, i + eConc);
      const results = await Promise.allSettled(
        slice.map(id => pfFetch(`/products/variant/${id}`, { useStoreHeader: false }))
      );
      results.forEach((rr, idx) => {
        if (rr.status !== 'fulfilled') return;
        const payload = rr.value || {};
        const v = payload.variant || payload.product || {};
        const files = Array.isArray(payload.files) ? payload.files : [];
        const img = v.image || (files.length ? files[0].url : undefined);
        enrichMap.set(slice[idx], {
          color: typeof v.color === 'string' ? v.color : undefined,
          size: typeof v.size === 'string' ? v.size : undefined,
          image: typeof img === 'string' ? img : undefined,
        });
      });
    }

    // merge into normalized variants
    for (const p of normalized) {
      for (const v of p.variants) {
        _catalogVariantId: Number(v.variant_id);
        const add = enrichMap.get(v._catalogVariantId);
        if (!add) continue;
        if (add.color) v.color = add.color;
        if (add.size) v.size = add.size;
        if (add.image) v.image = add.image;
        enrichedCount++;
      }
    }
  }

  // strip temp field
  const finalProducts = normalized.map(p => ({
  id: p.id,
  name: p.name,
  variants: p.variants.map(v => ({
    id: v.id,
    name: v.name,
    retail_price: v.retail_price,
    currency: v.currency,
    color: v.color,
    size: v.size,
    image: v.image,
  })),
  files: p.files,
  thumbnail_url: p.thumbnail_url,
}));

  return { products: finalProducts, enrichedCount };
}

// ----------------- Main -----------------
async function main() {
  const ds = (process.env.DATA_SOURCE || '').trim().toLowerCase();
  const key = process.env.PRINTFUL_API_KEY || '';
  const store = (process.env.PRINTFUL_STORE_ID || '').trim();
  const enrichOn = isTrue(process.env.PRINTFUL_ENRICH_VARIANTS);
  const enrichMax = Number(process.env.PRINTFUL_ENRICH_MAX || '200');

  console.log('[printful-prewarm] DATA_SOURCE =', ds || '(unset)');
  console.log('[printful-prewarm] PRINTFUL_API_KEY =', mask(key));
  console.log('[printful-prewarm] PRINTFUL_STORE_ID =', store || '(unset)');
  console.log('[printful-prewarm] ENRICH_VARIANTS =', enrichOn ? `on (max ${enrichMax})` : 'off');

  if (ds !== 'printful') {
    console.log('[printful-prewarm] Skipping: DATA_SOURCE != printful');
    return;
  }
  if (!store) {
    console.log('[printful-prewarm] Skipping: PRINTFUL_STORE_ID is required for store mode.');
    return;
  }

  try {
    const { products, enrichedCount } = await fetchStoreProducts();
    const ttl = Number(process.env.PRINTFUL_CACHE_TTL || '86400');
    const payload = { fetchedAt: new Date().toISOString(), ttl, products };
    await writeEverywhere(payload);
    console.log(`[printful-prewarm] Cached ${products.length} products. Enriched variants: ${enrichedCount}.`);
  } catch (e) {
    const msg = e && typeof e === 'object' && 'message' in e ? e.message : String(e);
    console.warn('[printful-prewarm] Failed (non-fatal):', msg);
    console.warn('[printful-prewarm] Build continues; app will use existing cache or empty state.');
  }
}

main();
