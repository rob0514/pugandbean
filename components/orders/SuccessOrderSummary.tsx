"use client";
import { useEffect, useState } from "react";
import { z } from "zod";
import ClearCartOnSuccess from "./ClearCartOnSuccess";

const SuccessDataSchema = z.object({
  id: z.string(),
  currency: z.string(),
  amountTotal: z.number(),
  paymentStatus: z.string(), // "paid", etc.
  lineItems: z.array(z.object({
    name: z.string(),
    qty: z.number(),
    unitAmount: z.number(),
    canonicalKey: z.string().nullable().optional(),
  })),
  shipping: z.object({
    label: z.string(),
    amount: z.number(),
  }).optional(),
});
type SuccessData = z.infer<typeof SuccessDataSchema>;

const ApiErrorSchema = z.object({ error: z.string() }).catchall(z.unknown());

export default function SuccessOrderSummary({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<SuccessData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const url = `/api/checkout/success?session_id=${encodeURIComponent(sessionId)}`;
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          const errRaw: unknown = await res.json().catch(() => ({}));
          const parsedErr = ApiErrorSchema.safeParse(errRaw);
          const msg = parsedErr.success ? parsedErr.data.error : `Failed to load order (${res.status})`;
          throw new Error(msg);
        }
        const raw: unknown = await res.json();
        const parsed = SuccessDataSchema.parse(raw);
        if (!cancelled) setData(parsed);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load order";
        if (!cancelled) setErr(msg);
      }
    })();

    return () => { cancelled = true; };
  }, [sessionId]);

  if (err) return <p className="text-red-600">{err}</p>;
  if (!data) return <p>Loading order…</p>;

  const { id, currency, amountTotal, lineItems, paymentStatus } = data;

  return (
    <div className="space-y-4">
      {/* clears cart once the order is confirmed paid */}
      <ClearCartOnSuccess sessionId={id} paymentStatus={paymentStatus} />

      <h2 className="text-xl font-medium">Thanks! Your order is confirmed.</h2>
      <ul className="divide-y">
  {lineItems.map((li, i) => (
    <li key={i} className="py-3 flex justify-between">
      <span className="text-sm">
        {li.name} × {li.qty}
      </span>
      <span className="text-sm">
        {currency} {(li.unitAmount * li.qty).toFixed(2)}
      </span>
    </li>
  ))}
</ul>
{data.shipping && data.shipping.amount > 0 ? (
  <div className="pt-2 flex justify-between text-sm">
    <span>{data.shipping.label}</span>
    <span>
      {currency} {data.shipping.amount.toFixed(2)}
    </span>
  </div>
) : null}

      <div className="pt-3 flex justify-between font-medium text-lg">
        <span>Total</span>
        <span>{currency} {amountTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}
