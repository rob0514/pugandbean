"use client";

import { env } from "@/lib/env";
import { mapProductToSnipcart } from "@/lib/payments/mapProductToSnipcart";
import type { Product } from "@/lib/types";

export default function AddToCartButton({ product }: { product: Product }) {
  if (!env.useSnipcart) {
    return (
      <button
        className="btn btn-primary"
        onClick={() => console.log("[mock] add to cart", product.id)}
      >
        Add to Cart
      </button>
    );
  }

  const attrs = mapProductToSnipcart(product, env.appUrl);

  return (
    <button className="snipcart-add-item btn btn-primary" {...attrs}>
      Add to Cart
    </button>
  );
}
