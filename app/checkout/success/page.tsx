"use client";

import { useState } from "react";

type Order = {
  token?: string;
  invoiceNumber?: string;
  email?: string; // from test flow; do not display if you prefer zero-PII
  items: { id: string; name: string; qty: number; price: number }[];
  totals: { items: number; grandTotal: number };
  placedAt?: string;
};

export default function SuccessPage() {
  // Read last order once on first client render; no effects needed.
  const [order] = useState<Order | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem("snipcart:lastOrder");
      return raw ? (JSON.parse(raw) as Order) : null;
    } catch {
      return null;
    }
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Order complete</h1>
      <p className="mt-2 opacity-75">
        Thanks! We’ve received your order. A confirmation email is on its way.
      </p>

      <section className="mt-8 rounded-xl border p-6">
        {order ? (
          <pre className="text-sm overflow-auto">
            {JSON.stringify(order, null, 2)}
          </pre>
        ) : (
          <p className="text-sm opacity-75">
            We couldn’t find your last order in this browser. If you just
            checked out, try refreshing this page.
          </p>
        )}
      </section>
    </main>
  );
}
