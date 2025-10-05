"use client";

import { env } from "@/lib/env";
import { useEffect, useRef, useState } from "react";

type Props = { className?: string };

export default function CartTrigger({ className }: Props) {
  const [count, setCount] = useState(0);
  const unsub = useRef<null | (() => void)>(null);

  useEffect(() => {
    if (!env.useSnipcart || typeof window === "undefined") return;

    const onReady = () => {
      if (!window.Snipcart?.store) return;
      const update = () =>
        setCount(window.Snipcart!.store.getState()?.cart?.items?.count ?? 0);
      update();
      unsub.current = window.Snipcart!.store.subscribe(update);
    };

    // Fast path if already booted
    if (window.Snipcart?.store) onReady();
    else document.addEventListener("snipcart.ready", onReady as EventListener);

    return () => {
      document.removeEventListener("snipcart.ready", onReady as EventListener);
      if (unsub.current) unsub.current();
    };
  }, []);

  if (!env.useSnipcart) {
    // M1 mock fallback
    return (
      <button className={className} data-testid="mock-cart-trigger">
        Cart{" "}
        <span className="ml-1 rounded bg-black/10 px-1.5 text-xs">{count}</span>
      </button>
    );
  }

  return (
    <button className={`snipcart-checkout ${className ?? ""}`} aria-label="Open cart">
      Cart{" "}
      <span data-cart-badge className="ml-1 rounded bg-black/10 px-1.5 text-xs">
        {count}
      </span>
    </button>
  );
}
