// components/CartButton.client.tsx
"use client";
import { useCartUI } from "@/store/cart-ui";

export default function CartButton() {
  const { openCart } = useCartUI();
  return (
    <button aria-label="Open cart" onClick={openCart} className="bg-stone-700 text-white rounded-xl px-3 py-2 prointer">
      Cart
    </button>
  );
}
