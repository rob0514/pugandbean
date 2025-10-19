import { NextResponse } from "next/server";
import { BUILD_TAG } from "@/lib/build";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    build: BUILD_TAG,
    env: process.env.VERCEL_ENV ?? "dev",
    domain: process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? null,
    hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasRedis: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
  });
}
