// components/payments/SnipcartPanelSizer.tsx
"use client";
import { useEffect } from "react";

export default function SnipcartPanelSizer({ width = 420, minBreakpoint = 768 }:{
  width?: number; minBreakpoint?: number;
}) {
  useEffect(() => {
    const apply = () => {
      if (window.innerWidth < minBreakpoint) return;
      const root = document.getElementById("snipcart");
      if (!root) return;

      const container = root.querySelector<HTMLElement>(
        ".snipcart-cart--side .snipcart-modal__container, " +
        ".snipcart-cart--side .snipcart-cart__container, " +
        ".snipcart-cart--side [class*='modal__container'], " +
        ".snipcart-cart--side [class*='cart__container']"
      );
      const content = root.querySelector<HTMLElement>(
        ".snipcart-cart--side .snipcart-modal__content, " +
        ".snipcart-cart--side .snipcart-cart__content, " +
        ".snipcart-cart--side [class*='modal__content'], " +
        ".snipcart-cart--side [class*='cart__content']"
      );

      if (container) {
        container.style.display = "flex";
        container.style.justifyContent = "flex-end";
      }
      if (content) {
        content.style.width = `${width}px`;
        content.style.maxWidth = "90vw";
        content.style.borderRadius = "12px 0 0 12px";
      }
    };

    const onReady = () => apply();
    document.addEventListener("snipcart.ready", onReady as EventListener);
    window.addEventListener("resize", apply);

    return () => {
      document.removeEventListener("snipcart.ready", onReady as EventListener);
      window.removeEventListener("resize", apply);
    };
  }, [width, minBreakpoint]);

  return null;
}
