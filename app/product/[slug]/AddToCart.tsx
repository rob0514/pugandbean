"use client";
import { useCart } from "@/store/cart";
import { useCartUI } from "@/store/cart-ui";
import { useState } from "react";

export default function AddToCart({
  productId,
  variantId,
  disabled = false,
}: { productId: string; variantId: string; disabled?: boolean }) {
  const { add } = useCart();
  const { openCart } = useCartUI();
  const [adding, setAdding] = useState(false);

  function onAdd() {
    if (disabled) return;
    setAdding(true);
    add({ productId, variantId, qty: 1 });
    openCart();
    setAdding(false);
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled || adding}
      aria-disabled={disabled || adding}
      className={`px-4 py-2 rounded-md text-white transition
        ${disabled ? "bg-neutral-400 cursor-not-allowed" : "bg-[#1C1C1C] hover:opacity-90"}`}
      aria-busy={adding}
    >
      {adding ? "Adding…" : "Add to Cart"}
    </button>
  );
}