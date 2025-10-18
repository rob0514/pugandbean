import Stripe from "stripe";

declare global {
  // reuse singleton in dev to prevent re-init
  var __stripe: Stripe | undefined;
}

export function getStripe(): Stripe {
  if (!global.__stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    global.__stripe = new Stripe(key, {
      apiVersion: "2025-09-30.clover", // use your current pinned version
    });
  }
  return global.__stripe;
}
