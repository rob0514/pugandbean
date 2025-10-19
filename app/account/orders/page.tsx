// app/account/orders/page.tsx
import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import { getOrdersForEmail } from "@/lib/orders/server";
import { toPublicUrl } from "@/lib/url";
import { BUILD_TAG } from "@/lib/build";

export const dynamic = "force-dynamic";

function fmtCurrency(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      currencyDisplay: "narrowSymbol",
    }).format((amountCents ?? 0) / 100);
  } catch {
    return `$${((amountCents ?? 0) / 100).toFixed(2)}`;
  }
}

export default async function OrdersPage() {
  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;

  if (!email) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-semibold">My Orders <span className="ml-2 text-xs text-muted-foreground">({BUILD_TAG})</span></h1>
        <p className="mt-4 text-sm text-muted-foreground">
          You’re signed in, but we couldn’t find an email on your profile. Add an email to view orders.
        </p>
      </div>
    );
  }

  const orders = await getOrdersForEmail(email);

  if (!orders.length) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-semibold">My Orders</h1>
        <p className="mt-4 text-sm text-muted-foreground">No orders yet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">My Orders</h1>

      <ul className="mt-6 space-y-4">
        {orders
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
          .map((o) => (
            <li key={o.id} className="rounded-2xl border p-4">
              {/* Header: id/date vs total/status */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  <div className="font-mono break-all">{o.id}</div>
                  <div>{new Date(o.createdAt).toLocaleString()}</div>
                  <div className="mt-1 text-xs">
                    {o.items.length} item{o.items.length === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-medium">
                    {fmtCurrency(o.amountCents, o.currency)}
                  </div>
                  <div className="text-sm uppercase tracking-wide">{o.status}</div>
                </div>
              </div>

              {/* Line items with thumbnails */}
              <div className="mt-4">
                <ul className="divide-y">
                  {o.items.map((it, i) => {
                    const lineSubtotal = (it.unitAmount ?? 0) * (it.qty ?? 1);
                    const hasImage = Boolean(it.image);
                    return (
                      <li key={i} className="flex items-center gap-3 py-3">
                        {/* Thumb */}
                        <div className="h-14 w-14 flex-none overflow-hidden rounded-md border bg-background">
                          {hasImage ? (
                            <Image
                              src={toPublicUrl(it.image) ?? "/placeholder.png"}
                              alt={it.title}
                              width={56}
                              height={56}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                              no img
                            </div>
                          )}
                        </div>

                        {/* Title + meta */}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {it.title || "Untitled"}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {it.variantId ? (
                              <span className="rounded bg-muted px-1.5 py-0.5">
                                {it.variantId}
                              </span>
                            ) : null}
                            <span className="tabular-nums">
                              {fmtCurrency(it.unitAmount ?? 0, o.currency)} × {it.qty ?? 1}
                            </span>
                          </div>
                        </div>

                        {/* Line subtotal */}
                        <div className="text-sm font-medium tabular-nums">
                          {fmtCurrency(lineSubtotal, o.currency)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Dev-only refund button */}
              {process.env.NODE_ENV === "development" ? (
                <form className="mt-4" action={`/api/orders/refund`} method="post">
                  <input type="hidden" name="sessionId" value={o.id} />
                  <button className="rounded-lg border px-3 py-1 text-sm hover:bg-accent" formMethod="post">
                    Refund (dev)
                  </button>
                </form>
              ) : null}
            </li>
          ))}
      </ul>
    </div>
  );
}
