export default function SnipcartDev() {
  const origin =
    typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <main className="mx-auto max-w-xl p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Snipcart Dev Test</h1>

      <button
        className="snipcart-add-item rounded bg-black px-4 py-2 text-white"
        data-item-id="test-tee"
        data-item-name="Test Tee"
        data-item-price="19.99"
        data-item-url={`${origin}/dev/snipcart`}
        data-item-image="https://picsum.photos/seed/pug/600/400"
      >
        Add Test Product
      </button>

      <button className="snipcart-checkout rounded border px-4 py-2">
        Open Cart
      </button>
    </main>
  );
}
