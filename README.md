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
