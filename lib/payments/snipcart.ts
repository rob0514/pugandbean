let initialized = false;

function whenSnipcartReady(cb: () => void) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { Snipcart?: { events?: unknown; store?: unknown } };

  // Fast-path if already ready
  if (w.Snipcart?.events && w.Snipcart?.store) {
    cb();
    return;
  }

  // Wait for the DOM event fired by Snipcart v3
  const onReady = () => {
    if (w.Snipcart?.events && w.Snipcart?.store) {
      document.removeEventListener("snipcart.ready", onReady as EventListener);
      cb();
    }
  };
  document.addEventListener("snipcart.ready", onReady as EventListener);
}

export function initSnipcartEvents() {
  if (initialized) return;
  initialized = true;

  whenSnipcartReady(() => {
    // At this point Snipcart is fully booted
    const { events, store } = window.Snipcart!;

    const log = (event: string, payload?: unknown) =>
      console.log(`[analytics] ${event}`, payload);

    events.on("cart.opened", () => log("checkout_start"));

    events.on("item.added", (p: unknown) => {
      const r = p as Partial<{ id: string; quantity: number }>;
      log("item_added", { id: r?.id, qty: r?.quantity });
    });

    events.on("item.removed", (p: unknown) => {
      const r = p as Partial<{ id: string }>;
      log("item_removed", { id: r?.id });
    });

    events.on("cart.confirmed", (orderUnknown: unknown) => {
      const order = orderUnknown as {
        token?: string;
        invoiceNumber?: string | number;
        user?: { email?: string };
        items?: unknown;
        grandTotal?: number;
        creationDate?: string;
      };

      const toItems = (list: unknown) => {
        if (!Array.isArray(list)) return [];
        return list.flatMap((raw) => {
          const r = raw as Partial<{ id: string; name: string; quantity: number; price: number }>;
          return (typeof r.id === "string" &&
            typeof r.name === "string" &&
            typeof r.quantity === "number" &&
            typeof r.price === "number")
            ? [{ id: r.id, name: r.name, qty: r.quantity, price: r.price }]
            : [];
        });
      };

      log("checkout_success", { token: order?.token, total: order?.grandTotal });

      try {
        const items = toItems(order?.items);
        sessionStorage.setItem(
          "snipcart:lastOrder",
          JSON.stringify({
            token: order?.token,
            invoiceNumber: order?.invoiceNumber,
            email: order?.user?.email ?? "",
            items,
            totals: { items: items.length, grandTotal: order?.grandTotal },
            placedAt: order?.creationDate,
          })
        );
        window.location.href = "/checkout/success";
      } catch {}
    });

    // Header badge sync
    store.subscribe(() => {
      const state = store.getState();
      const count = state.cart?.items?.count ?? 0;
      const badge = document.querySelector<HTMLElement>("[data-cart-badge]");
      if (badge) badge.innerText = String(count);
    });
  });
}
