"use client";
import { useCart } from "@/store/cart";

export function ProductCardClient({ productId, variantId }: { productId: string; variantId: string }) {
  const { add } = useCart();
  return (
    <button
      onClick={() => add({ productId, variantId, qty: 1 })}
      className="text-sm underline"
      aria-label="Add to cart"
    >
      Add
    </button>
  );
}
