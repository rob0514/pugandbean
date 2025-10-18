"use client";
import { useCart } from "@/store/cart";
import { useCartUI } from "@/store/cart-ui";
import { lookupUiCents } from "@/lib/pricing/uiPriceMap";
import CheckoutButton from './CheckoutButton';

function formatUSD(cents: number) {
  return (cents / 100).toFixed(2);
}

export default function CartDrawer() {
  const { items, updateQty, remove } = useCart();
  const { open, closeCart } = useCartUI();

  const itemCount = items.reduce((n, it) => n + it.qty, 0);
  const subtotalCents = items.reduce((sum, it) => {
    const cents = lookupUiCents(it.productId, it.variantId);
    return cents ? sum + cents * it.qty : sum;
  }, 0);

  return (
    <div aria-hidden={!open} className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={closeCart}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-[92vw] max-w-md bg-white text-black shadow-xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Shopping Cart"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Your Cart</h2>
          <button onClick={closeCart} aria-label="Close" className="text-sm underline">Close</button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-15rem)]">
          {items.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((it) => {
                const cents = lookupUiCents(it.productId, it.variantId);
                return (
                  <li key={`${it.productId}:${it.variantId}`} className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{it.productId}</div>
                      <div className="text-xs text-neutral-600">{it.variantId}</div>
                      {cents !== null ? (
                        <div className="text-xs text-neutral-800 mt-1">USD {formatUSD(cents)} ea.</div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        aria-label="Quantity"
                        type="number"
                        min={1}
                        max={99}
                        value={it.qty}
                        onChange={(e) =>
                          updateQty({ productId: it.productId, variantId: it.variantId }, Number(e.target.value))
                        }
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
                );
              })}
            </ul>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex justify-between text-sm mb-2">
            <span>Items</span>
            <span>{itemCount}</span>
          </div>
          {subtotalCents > 0 ? (
            <div className="flex justify-between text-base font-medium">
              <span>Subtotal</span>
              <span>USD {formatUSD(subtotalCents)}</span>
            </div>
          ) : (
            <div className="text-xs text-neutral-500 pb-3">Prices shown at checkout.</div>
          )}
          <CheckoutButton />
        </div>
      </aside>
    </div>
  );
}


 {/* <CheckoutButton /> */}