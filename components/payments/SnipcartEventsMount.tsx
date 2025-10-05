"use client";

import { useEffect } from "react";
import { initSnipcartEvents } from "@/lib/payments/snipcart";

export default function SnipcartEventsMount() {
  useEffect(() => {
    const onReady = () => initSnipcartEvents();

    // already booted?
    if (typeof window !== "undefined" && window.Snipcart?.store) {
      initSnipcartEvents();
    } else {
      document.addEventListener("snipcart.ready", onReady as EventListener);
    }

    return () => {
      document.removeEventListener("snipcart.ready", onReady as EventListener);
      // do NOT remove #snipcart, let it persist for the lifetime of the app
    };
  }, []);

  return null;
}
