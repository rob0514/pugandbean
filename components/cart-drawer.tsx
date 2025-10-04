'use client'
import { useCart } from '@/lib/cart'
import { type Product } from '@/types/product'


export function AddToCartButton({ product }: { product: Product }) {
const { add } = useCart()
return (
<button onClick={() => add(product)} className="rounded-xl px-5 py-3 bg-ink text-cream font-ui text-sm">Add to cart</button>
)
}


export function CartDrawer() {
const { isOpen, close, items, remove, total } = useCart()
return (
<div aria-hidden={!isOpen} className={`fixed inset-0 z-50 transition ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
<div className="absolute inset-0 bg-black/30" onClick={close} />
<aside role="dialog" aria-label="Cart" className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl p-6 grid grid-rows-[auto,1fr,auto]">
<header className="flex items-center justify-between">
<h2 className="font-ui font-medium">Your Cart</h2>
<button onClick={close} aria-label="Close cart">✕</button>
</header>
<div className="mt-4 overflow-y-auto divide-y">
{items.length === 0 ? (
<p className="text-ink/70">Your cart is empty.</p>
) : (
items.map((it, i) => (
<div key={i} className="py-3 flex items-center justify-between gap-3">
<div>
<div className="text-sm font-medium">{it.title}</div>
<div className="text-xs text-ink/60">Qty {it.quantity}</div>
</div>
<div className="text-sm">${((it.price*it.quantity)/100).toFixed(2)}</div>
<button onClick={() => remove(i)} aria-label="Remove item" className="text-xs">Remove</button>
</div>
))
)}
</div>
<footer className="pt-4">
<div className="flex items-center justify-between font-ui"><span>Subtotal</span><span>${(total/100).toFixed(2)}</span></div>
<button className="mt-3 w-full rounded-xl px-4 py-3 bg-fawn">Checkout (mock)</button>
</footer>
</aside>
</div>
)
}

