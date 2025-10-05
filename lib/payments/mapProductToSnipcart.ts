import type { Product } from "@/lib/types"; // your M1 Product

export type SnipcartItemAttrs = {
  "data-item-id": string;
  "data-item-name": string;
  "data-item-price": string; // as string per Snipcart data-* convention
  "data-item-url": string;
  "data-item-image"?: string;
};

export function mapProductToSnipcart(p: Product, baseUrl: string): SnipcartItemAttrs {
  // Ensure absolute URL (Snipcart requires canonical URL for the item)
  const url = new URL(`/shop/${p.slug}`, baseUrl).toString();

  return {
    "data-item-id": p.id,
    "data-item-name": p.title,
    "data-item-price": p.price.toFixed(2),
    "data-item-url": url,
    "data-item-image": p.image ?? undefined,
  };
}
