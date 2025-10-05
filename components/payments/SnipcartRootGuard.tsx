"use client";
import { useEffect } from "react";

export default function SnipcartRootGuard() {
  useEffect(() => {
    const ensure = () => {
      let root = document.getElementById("snipcart");
      if (!root) {
        root = document.createElement("div");
        root.id = "snipcart";
        root.setAttribute("hidden", "");
        root.setAttribute("data-config-modal-style", "modal");
        document.body.appendChild(root);
      } else if (root.parentNode !== document.body) {
        document.body.appendChild(root);
      }
    };

    // create immediately
    ensure();

    // if anything removes/moves it, put it back
    const mo = new MutationObserver(() => ensure());
    mo.observe(document.body, { childList: true });

    // Snipcart sometimes checks again on ready
    const onReady = () => ensure();
    document.addEventListener("snipcart.ready", onReady as EventListener);

    return () => {
      mo.disconnect();
      document.removeEventListener("snipcart.ready", onReady as EventListener);
    };
  }, []);

  return null;
}
