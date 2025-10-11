// components/CartButton.client.tsx
"use client";
import { useCart } from "@/lib/cart";

export default function CartButton() {
  const { open } = useCart();
  return (
    <button aria-label="Open cart" onClick={open} className="rounded-xl px-3 py-2">
      Cart
    </button>
  );
}
