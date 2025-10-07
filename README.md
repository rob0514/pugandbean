# This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## M2 — Snipcart Test Harness

### Toggle

- `.env`: `USE_SNIPCART=true|false` (default `false`)
- Add `SNIPCART_PUBLIC_API_KEY` (TEST key only) and `APP_URL`

### Test cards

- Use Snipcart test mode cards (e.g., 4242 4242 4242 4242, any future exp, any CVC)

### What shipping/tax?

- None in M2 (non-goals). This is a smoke test for “can users pay?”

### Success page

- We capture the confirmed order client-side and show a simple summary at `/checkout/success`.
- Data is test-only, non-PII persisted in `sessionStorage` under `snipcart:lastOrder`.

### Known limits

- No webhooks, no SSR, no server persistence, no coupons/subscriptions.
- Styling: minimal defaults, we only include Snipcart base theme for speed.

### CI / QA

- `pnpm lint && pnpm typecheck && pnpm build` (unchanged)
- Inspect Preview HTML when `USE_SNIPCART=false` → no Snipcart CSS/JS present.
- Visual: Home, Shop, PDP, Cart open, Checkout → Success (mobile + desktop).
- Lighthouse: no >5 drop compared to M1 on Home/Shop/PDP.

## M2 — Snipcart Test Harness (Feature-Flagged)

**Goal:** Smoke test “can users pay?” using Snipcart in TEST mode. No fulfillment, no server persistence.

### Toggle Snipcart

- `.env`: `NEXT_PUBLIC_USE_SNIPCART=true|false` (default `false`)
- Add:
  - `NEXT_PUBLIC_SNIPCART_PUBLIC_API_KEY=snip_public_test_…`
  - `NEXT_PUBLIC_APP_URL=<public site URL>` (Preview/Prod URL or tunnel URL)

### Required setup

1. **Public URL**  
   Snipcart crawls each `data-item-url`. Use a **Vercel Preview** domain or a tunnel (ngrok / Cloudflare).  
   Set `NEXT_PUBLIC_APP_URL` to that public URL.

2. **Allow domains in Snipcart**  
   Snipcart Dashboard → **Store settings → Domains** → add your Preview URL (and Prod).

3. **CSP**  
   Ensure the app sends a CSP that allows Snipcart:
   - `script-src … https://cdn.snipcart.com`
   - `connect-src … https://app.snipcart.com https://cdn.snipcart.com https://payment.snipcart.com`
   - `frame-src … https://payment.snipcart.com`
   - `img-src` can be `self` + `data:` (use `/public/*` images in M2)

### What’s implemented

- Snipcart loads only when `NEXT_PUBLIC_USE_SNIPCART=true`.
- Add to cart / update qty / remove / open checkout / **complete test purchase**.
- Confirmation uses **Snipcart’s built-in “Thank you”** page (by design for M2).
- No PII persistence; no webhooks. Console-only analytics stubs.
- With flag **off**, no Snipcart assets are included and the M1 mock cart still works.

### How to test

- **Local with tunnel** (optional): `ngrok http 3000` → set `NEXT_PUBLIC_APP_URL=https://<sub>.ngrok-free.app`.
- **Vercel Preview (recommended)**:
  1. Set Preview env vars (Toggle section above), redeploy.
  2. Visit the site, Add → Open Cart → checkout with test card `4242 4242 4242 4242` (any future exp, any CVC).
  3. You should land on Snipcart’s confirmation page.

### QA checklist

- [ ] Flag OFF: no Snipcart CSS/JS in page source; mock cart works.
- [ ] Flag ON: cart opens, qty updates, remove works.
- [ ] Checkout completes with test card (TEST mode).
- [ ] **No hydration or navigation errors** when moving between pages.
- [ ] Lighthouse drop ≤ 5 pts vs M1 on Home / Shop / PDP.
- [ ] CI green: lint, typecheck, build.

### Known limits (M2)

- Uses Snipcart **TEST** key only.
- No taxes/shipping/coupons/subscriptions.
- No server persistence or webhooks (scaffold later).
- Confirmation is hosted by Snipcart (no `/checkout/success` redirect in M2).

### Rollback / Risks

- If any CLS/hydration issue appears, flip `NEXT_PUBLIC_USE_SNIPCART=false` and redeploy.
- Keep M1 mock cart intact so the site remains usable without Snipcart.

### Dev tips / gotchas

- If checkout errors with `domain-crawling-failed`, `data-item-url` isn’t publicly reachable or the domain isn’t allowed in Snipcart.
- If buttons feel dead on first click, confirm `<script id="snipcart-settings">` is in `<head>` and `snipcart.js` loads (Network tab).
- If you see CSP blocks, check the **document response headers** (Network → main document), not just local code.
