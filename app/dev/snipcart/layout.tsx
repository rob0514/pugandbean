// This nested layout injects settings in <head> BEFORE the runtime,
// and loads Snipcart only for this /dev/snipcart subtree.
import Script from "next/script";

export default function DevSnipcartLayout({ children }: { children: React.ReactNode }) {
  const key = process.env.NEXT_PUBLIC_SNIPCART_PUBLIC_API_KEY ?? "";
  return (
    <html lang="en">
      <head>
        {/* Settings MUST come before runtime */}
        <Script id="snipcart-settings" strategy="beforeInteractive">
          {`window.SnipcartSettings = {
            publicApiKey: "${key}",
            // use 'always' on preview to avoid lazy-load edge cases
            loadStrategy: "always"
          };`}
        </Script>

        {/* Snipcart CSS */}
        <link
          rel="stylesheet"
          href="https://cdn.snipcart.com/themes/v3.6.1/default/snipcart.css"
        />
      </head>
      <body>
        {children}

        {/* Snipcart runtime AFTER interactive */}
        <Script
          src="https://cdn.snipcart.com/themes/v3.6.1/default/snipcart.js"
          strategy="afterInteractive"
        />
        {/* Required root node */}
        <div id="snipcart" hidden data-config-modal-style="side" />
      </body>
    </html>
  );
}
