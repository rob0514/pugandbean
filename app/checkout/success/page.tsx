"use client";

import { useEffect, useState } from "react";

type Order = {
  token?: string;
  invoiceNumber?: string;
  email?: string; // from test flow; do not display if you prefer zero-PII
  items: { id: string; name: string; qty: number; price: number }[];
  totals: { items: number; grandTotal: number };
  placedAt?: string;
};

export default function SuccessPage() {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("snipcart:lastOrder");
      if (raw) setOrder(JSON.parse(raw));
    } catch {}
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-semibold">Thank you!</h1>
      <p className="mb-8 text-neutral-600">Your test order has been received.</p>

      {!order ? (
        <p className="text-sm text-neutral-500">
          We couldn’t locate order details. If this was a test purchase, the event may not have fired yet.
        </p>
      ) : (
        <section className="rounded-2xl border p-6">
          <div className="mb-4 text-sm text-neutral-600">
            <div>Order: <span className="font-medium">{order.invoiceNumber ?? order.token}</span></div>
            {order.placedAt && <div>Placed: {new Date(order.placedAt).toLocaleString()}</div>}
          </div>
          <ul className="divide-y">
            {order.items.map((i) => (
              <li key={i.id} className="py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>{i.name} × {i.qty}</span>
                  <span>${(i.qty * i.price).toFixed(2)}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t pt-4 font-medium">
            <span>Total</span>
            <span>${order.totals.grandTotal?.toFixed?.(2) ?? "0.00"}</span>
          </div>
        </section>
      )}
    </main>
  );
}
