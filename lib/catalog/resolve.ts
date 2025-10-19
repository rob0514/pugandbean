// lib/catalog/resolve.ts
// Plug this into wherever your mock catalog lives.
// Return a URL or undefined if not found.

export interface CatalogItem {
  id: string;            // canonical productId
  title: string;
  image?: string;
  variants?: Array<{ id: string; image?: string }>;
}

// TODO: replace with your actual data import:
// e.g. `import { MOCK_PRODUCTS } from "@/lib/mock/products";`
const CATALOG: CatalogItem[] = []; // fill or re-export from your existing catalog module

export function imageFor(productId: string, variantId?: string | null): string | undefined {
  const p = CATALOG.find(x => x.id === productId);
  if (!p) return undefined;
  if (variantId && p.variants?.length) {
    const v = p.variants.find(vv => vv.id === variantId);
    if (v?.image) return v.image;
  }
  return p.image;
}
