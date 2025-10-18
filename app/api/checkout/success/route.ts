import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");
  if (!session_id) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ["line_items.data.price.product"],
  });

  const currency = (session.currency ?? "usd").toUpperCase();
  const amountTotal = (session.amount_total ?? 0) / 100;
  const paymentStatus = session.payment_status ?? "unpaid";

  const lineItems =
    session.line_items?.data.map((li) => {
      const qty = li.quantity ?? 0;
      const unitAmount = (li.price?.unit_amount ?? 0) / 100;
      const name =
        (typeof li.price?.product === "object" && li.price?.product && "name" in li.price.product
          ? (li.price.product as { name?: string }).name
          : li.description) ?? "Item";
      return { name, qty, unitAmount };
    }) ?? [];

  return NextResponse.json(
    { id: session.id, currency, amountTotal, paymentStatus, lineItems },
    { status: 200 }
  );
}
