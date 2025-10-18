// app/api/checkout/session/route.ts
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { CheckoutRequestSchema } from "@/lib/schemas/checkout";
import { findPriceId } from "@/lib/pricing/priceMap";
import type Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const json: unknown = await req.json();
    const parsed = CheckoutRequestSchema.parse(json);

    // Build absolute URLs from the current request
    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;

    const line_items = parsed.items.map((it) => {
      const priceId = findPriceId(it.productId, it.variantId);
      if (!priceId) throw new Error(`No price found for ${it.productId}:${it.variantId}`);
      return { price: priceId, quantity: it.qty };
    });

    const stripe = getStripe();
    const enableTax = (process.env.STRIPE_TAX ?? "").toLowerCase() === "on";
const enableShip = (process.env.STRIPE_SHIPPING ?? "").toLowerCase() === "on";

const shipCountries = (process.env.STRIPE_SHIP_COUNTRIES ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const shippingFlatCents = Number.parseInt(process.env.STRIPE_SHIP_FLAT_CENTS ?? "0", 10);
const shippingLabel = process.env.STRIPE_SHIP_LABEL ?? "Shipping";

// Narrow to Stripe’s allowed country union (2-letter ISO codes)
type AllowedCountry = Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry;
const allowedCountries: AllowedCountry[] = shipCountries
  .map((c) => c.toUpperCase())
  .filter((c): c is AllowedCountry => /^[A-Z]{2}$/.test(c));
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items,
  success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/checkout/cancel`,
  allow_promotion_codes: true,
  submit_type: "pay",
  billing_address_collection: "auto",
  automatic_tax: enableTax ? { enabled: true } : undefined,
  shipping_address_collection:
  enableShip && allowedCountries.length
    ? { allowed_countries: allowedCountries }
    : undefined,shipping_options:
    enableShip && shippingFlatCents > 0
      ? [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: shippingFlatCents, currency: "usd" }, // adjust currency if needed
              display_name: shippingLabel,
            },
          },
        ]
      : undefined,
});

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
