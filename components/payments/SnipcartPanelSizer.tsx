"use client";

import { useEffect } from "react";

export default function SnipcartPanelSizer({
  width = 420, // px, tweak to taste
  minBreakpoint = 768, // only constrain on desktop
}: { width?: number; minBreakpoint?: number }) {

  useEffect(() => {
    const apply = () => {
      if (window.innerWidth < minBreakpoint) return;

      // Container: ensure it hugs the right edge
      const container =
        document.querySelector<HTMLElement>(
          "#snipcart .snipcart-cart--side .snipcart-modal__container, " +
          "#snipcart .snipcart-cart--side .snipcart-cart__container, " +
          "#snipcart .snipcart-cart--side [class*='modal__container'], " +
          "#snipcart .snipcart-cart--side [class*='cart__container']"
        );

      const content =
        document.querySelector<HTMLElement>(
          "#snipcart .snipcart-cart--side .snipcart-modal__content, " +
          "#snipcart .snipcart-cart--side .snipcart-cart__content, " +
          "#snipcart .snipcart-cart--side [class*='modal__content'], " +
          "#snipcart .snipcart-cart--side [class*='cart__content']"
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

    // run now, when Snipcart signals ready, and whenever DOM under #snipcart changes
    apply();
    const onReady = () => apply();
    document.addEventListener("snipcart.ready", onReady as EventListener);

    const root = document.getElementById("snipcart");
    const mo = root ? new MutationObserver(apply) : null;
    if (root && mo) mo.observe(root, { subtree: true, childList: true });

    // also re-apply on resize so it behaves around the breakpoint
    const onResize = () => apply();
    window.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("snipcart.ready", onReady as EventListener);
      window.removeEventListener("resize", onResize);
      mo?.disconnect();
    };
  }, [width, minBreakpoint]);

  return null;
}
