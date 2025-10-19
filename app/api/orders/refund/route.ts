import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createOrdersStore } from "@/lib/orders/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-09-30.clover",
});
const store = createOrdersStore();

function _isAdmin(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS ?? "";
  const allowed = raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

// Simple body parser & guard
async function readBody(req: Request): Promise<{ sessionId?: string }> {
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      return (await req.json()) as { sessionId?: string };
    }
    // support form POST from page.tsx
    const form = await req.formData();
    return { sessionId: String(form.get("sessionId") || "") };
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  // Dev only by default; allow prod if ADMIN_EMAILS explicitly set.
  const isDev = process.env.NODE_ENV !== "production";
  const allowAdmin = Boolean(process.env.ADMIN_EMAILS);

  if (!isDev && !allowAdmin) {
    return NextResponse.json({ error: "Disabled" }, { status: 403 });
  }

  // Optional: if using Clerk server auth, you can check the current user email here
  // import { auth, currentUser } from "@clerk/nextjs/server";
  // const user = await currentUser(); if (!user || !isAdmin(user?.primaryEmailAddress?.emailAddress ?? "")) { ... }

  const { sessionId } = await readBody(req);
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  try {
    // Get session to find payment_intent
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    const pi = session.payment_intent;
    if (!pi || typeof pi === "string") {
      return NextResponse.json({ error: "No payment_intent found" }, { status: 400 });
    }

    await stripe.refunds.create({ payment_intent: pi.id });
    await store.setRefunded(sessionId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[refund] error", err);
    return NextResponse.json({ error: "Refund failed" }, { status: 500 });
  }
}
