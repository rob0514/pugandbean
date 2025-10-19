// Backfill Stripe Price metadata for productId, variantId, and image
// Uses local PRICE_MAP (priceId lookup) + local catalog images.
// DRY_RUN=1 to preview. Requires STRIPE_SECRET_KEY.

import Stripe from "stripe";
import fs from "node:fs";
import path from "node:path";

const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-09-30.clover" });

// ---- CONFIG: update these paths if your files live elsewhere ----
const PRICE_MAP_PATH = path.join(process.cwd(), "data", "price-map.json");
const CATALOG_PATH   = path.join(process.cwd(), "data", "products.json");

// If images are site-relative ("/foo.jpg"), prefix with your site origin:
function normalizeImageUrl(x) {
  if (!x) return undefined;
  if (x.startsWith("http://") || x.startsWith("https://")) return x;
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (x.startsWith("/")) return `${origin}${x}`;
  return x;
}

function firstOf(arr) {
  if (!Array.isArray(arr)) return undefined;
  for (const s of arr) {
    if (typeof s === "string" && s.trim()) return s.trim();
  }
  return undefined;
}

// Load PRICE_MAP and invert it to priceId → { productId, variantId }
function loadPriceMap() {
  const raw = fs.readFileSync(PRICE_MAP_PATH, "utf8");
  const map = JSON.parse(raw); // { [productId]: { [variantId]: priceId } }
  const byPriceId = new Map(); // priceId → { productId, variantId }
  for (const [productId, variants] of Object.entries(map)) {
    for (const [variantId, priceId] of Object.entries(variants)) {
      byPriceId.set(String(priceId), { productId, variantId: variantId || null });
    }
  }
  return byPriceId;
}

function loadCatalog() {
  const raw = fs.readFileSync(CATALOG_PATH, "utf8");
  const products = JSON.parse(raw);
  const byId = new Map(); // productId → product
  for (const p of products) byId.set(p.id, p);
  return byId;
}

function resolveImage(catalogById, productId, variantId) {
  const p = catalogById.get(productId);
  if (!p) return undefined;
  if (variantId && Array.isArray(p.variants)) {
    const v = p.variants.find((vv) => vv.id === variantId);
    const vImg = firstOf(v?.images) || (typeof v?.image === "string" ? v.image : undefined);
    if (vImg) return normalizeImageUrl(vImg);
  }
  const pImg = firstOf(p.images) || (typeof p.image === "string" ? p.image : undefined);
  return normalizeImageUrl(pImg);
}

async function main() {
  const priceIdIndex = loadPriceMap(); // price_123 → { productId, variantId }
  const catalogById = loadCatalog();

  let scanned = 0, updated = 0, unchanged = 0, skippedNoMap = 0, skippedNoImage = 0;

  for await (const price of stripe.prices.list({ limit: 100 })) {
    scanned++;

    const mapping = priceIdIndex.get(price.id);
    if (!mapping) { skippedNoMap++; continue; }

    const { productId, variantId } = mapping;

    // Prefer existing metadata.image, otherwise resolve from catalog
    const md = price.metadata || {};
    const image = md.image || resolveImage(catalogById, productId, variantId);

    if (!image) { skippedNoImage++; continue; }

    // Only update if something will change
    const newMd = {
      ...md,
      productId,                   // ensure present
      ...(variantId ? { variantId } : { variantId: "" }),
      image
    };

    const willChange =
      md.productId !== newMd.productId ||
      (md.variantId || "") !== (newMd.variantId || "") ||
      md.image !== newMd.image;

    if (!willChange) { unchanged++; continue; }

    if (DRY_RUN) {
      console.log(`[DRY] ${price.id} ← productId=${productId} variantId=${variantId ?? ""} image=${image}`);
      updated++;
    } else {
      await stripe.prices.update(price.id, { metadata: newMd });
      console.log(`updated ${price.id} ← productId=${productId} variantId=${variantId ?? ""} image=${image}`);
      updated++;
    }
  }

  console.log("---- summary ----");
  console.log({ scanned, updated, unchanged, skippedNoMap, skippedNoImage, dryRun: DRY_RUN });
}

main().catch((e) => { console.error(e); process.exit(1); });
