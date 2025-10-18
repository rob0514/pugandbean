"use client";
import * as React from "react";
import { useState } from "react";
import { useCart } from "@/store/cart";
import { CheckoutRequestSchema } from "@/lib/schemas/checkout";
import { z } from "zod";

const CheckoutUrlSchema = z.object({ url: z.string().url() });
const ApiErrorSchema = z.object({ error: z.string() }).catchall(z.unknown());

export default function CheckoutButton() {
  const { items } = useCart();
  const [loading, setLoading] = useState(false);

  async function onCheckout() {
    setLoading(true);
    try {
      // Validate before sending
      const parsed = CheckoutRequestSchema.parse({ items });
const res = await fetch("/api/checkout/session", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(parsed),
});
console.log("checkout items:", items.map(i => `${i.productId}:${i.variantId}`));
if (!res.ok) {
  const errRaw: unknown = await res.json().catch(() => ({}));
  const parsedErr = ApiErrorSchema.safeParse(errRaw);
  const msg = parsedErr.success ? parsedErr.data.error : `Checkout failed (${res.status})`;
  throw new Error(msg);
}

const dataRaw: unknown = await res.json();
const { url } = CheckoutUrlSchema.parse(dataRaw);
window.location.href = url;
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Checkout error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
    disabled={loading || items.length === 0}
    onClick={() => { void onCheckout(); }}   // 👈 satisfy void-return expectation
    className="px-4 py-2 rounded-md bg-[#D9A86C] text-[#1C1C1C] disabled:opacity-50"
    aria-busy={loading}
  >
    {loading ? "Redirecting…" : "Checkout"}
  </button>
  );
}
