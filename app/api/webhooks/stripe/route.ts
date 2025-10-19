import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createOrdersStore } from "@/lib/orders/store";
import type { Order, OrderItem } from "@/types/order";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-09-30.clover", // keep aligned with your M6
});

const store = createOrdersStore();

function upperCurrency(code?: string | null): string {
  return (code ?? "").toUpperCase();
}

// Narrow a Stripe.Event to the specific completed type
function isCheckoutCompleted(
  evt: Stripe.Event
): evt is Stripe.CheckoutSessionCompletedEvent {
  return evt.type === "checkout.session.completed";
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whSecret) {
    console.error("[stripe webhook] Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Misconfigured webhook" }, { status: 500 });
  }

  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, whSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe webhook] Signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (isCheckoutCompleted(event)) {
      // This is already the typed event for a completed session
      const sess = event.data.object;

      // Re-retrieve with expansions we need to build the Order
      const fullSession = await stripe.checkout.sessions.retrieve(sess.id, {
        expand: ["line_items.data.price.product", "payment_intent"],
      });

      const lineItems = fullSession.line_items?.data ?? [];

      const items: OrderItem[] = lineItems.map((li) => {
        const price = li.price!;
        // product is expanded above, so this cast is safe given our expand
        const product = price.product as Stripe.Product;
        const qty = li.quantity ?? 1;

        const productId =
          (product?.metadata?.productId as string | undefined) ||
          (price?.metadata?.productId as string | undefined) ||
          product?.id ||
          "unknown-product";

        const variantId =
          (price?.metadata?.variantId as string | undefined) ?? null;

        const image =
          (price?.metadata?.image as string | undefined) ||
          (Array.isArray(product?.images) ? product.images[0] : undefined);

        const title =
          (li.description as string | undefined) ||
          (product?.name as string | undefined) ||
          "Untitled";

        return {
          productId,
          variantId,
          title,
          unitAmount: price.unit_amount ?? 0,
          qty,
          image,
        };
      });

      const order: Order = {
        id: fullSession.id,
        provider: "stripe",
        status: "paid",
        amountCents: fullSession.amount_total ?? 0,
        currency: upperCurrency(fullSession.currency),
        items,
        customerEmail: fullSession.customer_details?.email ?? null,
        createdAt: new Date().toISOString(),
      };

      await store.upsert(order);

      if (process.env.NODE_ENV !== "production") {
        console.log("[stripe webhook] stored order", {
          id: order.id,
          email: order.customerEmail,
          total: order.amountCents,
          items: order.items.length,
        });
      }
    }

    // Always acknowledge so Stripe doesn't spam retries in dev
    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe webhook] handler error:", message);
    // Acknowledge with a soft error flag (dev); you can flip to 500 later if desired.
    return NextResponse.json({ received: true, error: true });
  }
}
