// app/checkout/success/page.tsx
import SuccessOrderSummary from "@/components/orders/SuccessOrderSummary";

export const metadata = { title: "Order Success • Pug & Bean" };

type Props = { searchParams: Promise<{ session_id?: string }> };

export default async function SuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams; // ✅ await
  if (!session_id) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-medium">Order Success</h1>
        <p className="mt-2">We couldn’t find your last order in this browser. If you just checked out, try refreshing this page.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-medium">Order Success</h1>
      <SuccessOrderSummary sessionId={session_id} />
    </main>
  );
}
