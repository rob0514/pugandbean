import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { getAllProducts } from "@/lib/datasource"; // server-only is fine here

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");
  if (!session_id) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  const stripe = getStripe();
  // expand price.product for product name and shipping_rate for label
  const session = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ["line_items.data.price.product", "shipping_cost.shipping_rate"],
  });

  // Build a lookup for variant titles from our catalog
  const catalog = await getAllProducts();
  const productTitleById = new Map<string, string>();
  const variantTitleByKey = new Map<string, string>(); // key = `${productId}:${variantId}`
  for (const p of catalog) {
    productTitleById.set(p.id, p.title);
    for (const v of p.variants) {
      variantTitleByKey.set(`${p.id}:${v.id}`, v.title);
    }
  }

  const currency = (session.currency ?? "usd").toUpperCase();
  const amountTotal = (session.amount_total ?? 0) / 100;
  const paymentStatus = session.payment_status ?? "unpaid";

  const li = session.line_items?.data ?? [];
  const lineItems = li.map((item) => {
    const qty = item.quantity ?? 0;
    const unitAmount = (item.price?.unit_amount ?? 0) / 100;

    // Prefer our canonical key → get variant title; fall back to Stripe names
    const canonicalKey = (item.price?.metadata?.canonical_key as string | undefined) ?? null;
    let name =
      (typeof item.price?.product === "object" && item.price?.product && "name" in item.price.product
        ? (item.price.product as { name?: string }).name ?? undefined
        : undefined) ?? item.description ?? "Item";

    if (canonicalKey) {
      const variantTitle = variantTitleByKey.get(canonicalKey);
      const productId = canonicalKey.split(":")[0] ?? "";
      const productTitle = productTitleById.get(productId);
      if (productTitle && variantTitle) {
        name = `${productTitle} – ${variantTitle}`;
      } else if (productTitle) {
        name = productTitle;
      }
    }

    return { name, qty, unitAmount, canonicalKey };
  });

  // Shipping summary
  const shippingRate = session.shipping_cost?.shipping_rate as
    | Stripe.ShippingRate
    | string
    | null
    | undefined;

  const shipping = {
    label:
      typeof shippingRate === "object" && shippingRate
        ? shippingRate.display_name ?? "Shipping"
        : "Shipping",
    amount: (session.shipping_cost?.amount_total ?? 0) / 100,
  };

  return NextResponse.json(
    {
      id: session.id,
      currency,
      amountTotal,
      paymentStatus,
      lineItems,
      shipping, // { label, amount }
    },
    { status: 200 }
  );
}
