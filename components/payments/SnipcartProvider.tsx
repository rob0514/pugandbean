// components/payments/SnipcartProvider.tsx
"use client";
import Script from "next/script";
import { initSnipcartEvents } from "@/lib/payments/snipcart";

export default function SnipcartProvider() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.snipcart.com/themes/v3.6.1/default/snipcart.css"
      />
      <Script
        src="https://cdn.snipcart.com/themes/v3.6.1/default/snipcart.js"
        strategy="afterInteractive"
        onLoad={() => initSnipcartEvents()}
      />
      <div id="snipcart" hidden data-config-modal-style="side" />
    </>
  );
}
