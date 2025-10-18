import { NextResponse } from "next/server";
import _Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";

export const runtime = "nodejs"; // ensure edge doesn't strip raw body

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const stripe = getStripe();
  const rawBody = await req.text();

  try {
    const _event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // TODO: handle events (checkout.session.completed, etc.)
    // For now, just 200 OK.
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
