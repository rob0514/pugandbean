import { requireAuth } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  await requireAuth("/orders");

  // TODO (future): read from Snipcart test API or your own orders table
  const mock = [
    { id: "ord_123", date: "2025-10-01", total: "$0.00", status: "Test" },
    { id: "ord_124", date: "2025-10-02", total: "$0.00", status: "Test" },
  ];

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold">My Orders</h1>
      <ul className="mt-6 divide-y rounded-xl border">
        {mock.map((o) => (
          <li key={o.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{o.id}</div>
              <div className="text-sm text-muted-foreground">{o.date}</div>
            </div>
            <div className="text-right">
              <div className="font-medium">{o.total}</div>
              <div className="text-sm text-muted-foreground">{o.status}</div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">
        Placeholder list for M5. Real data to follow in a later milestone.
      </p>
    </main>
  );
}
