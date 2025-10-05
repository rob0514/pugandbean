"use client";

const base = process.env.NEXT_PUBLIC_APP_URL ?? ""; // should be your Vercel preview URL

export default function SnipcartDev() {
  return (
    <main className="mx-auto max-w-xl p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Snipcart Dev Test (Preview)</h1>

      {/* Use a LOCAL image in /public to avoid CSP churn */}
      <button
        className="snipcart-add-item rounded bg-black px-4 py-2 text-white"
        data-item-id="test-tee"
        data-item-name="Test Tee"
        data-item-price="19.99"
        data-item-url={`${base}/dev/snipcart`}
        data-item-image="/test.png"
      >
        Add Test Product
      </button>

      <button className="snipcart-checkout rounded border px-4 py-2">
        Open Cart
      </button>
    </main>
  );
}
