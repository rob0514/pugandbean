"use client";
import { useCart } from "@/store/cart";

export default function ClientCart() {
  const { items, updateQty, remove } = useCart();
  if (items.length === 0) return <p>Your cart is empty.</p>;

  return (
    <ul className="divide-y">
      {items.map((it) => (
        <li key={`${it.productId}:${it.variantId}`} className="py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium">{it.productId}</div>
            <div className="text-xs text-neutral-600">{it.variantId}</div>
          </div>

          <div className="flex items-center gap-2">
            <input
              aria-label="Quantity"
              type="number"
              min={1}
              max={99}
              value={it.qty}
              onChange={(e) => updateQty({ productId: it.productId, variantId: it.variantId }, Number(e.target.value))}
              className="w-16 border rounded px-2 py-1"
            />
            <button
              onClick={() => remove({ productId: it.productId, variantId: it.variantId })}
              className="text-sm underline"
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
