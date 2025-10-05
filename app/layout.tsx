// app/layout.tsx  (Server Component)
import Script from "next/script";
import { env } from "@/lib/env";
import SnipcartProvider from "@/components/payments/SnipcartProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {env.useSnipcart && (
          <Script id="snipcart-settings" strategy="beforeInteractive">
            {`window.SnipcartSettings = {
              publicApiKey: "${env.snipcartPublicKey}",
              loadStrategy: "always"
            };`}
          </Script>
        )}
        {env.useSnipcart && (
          <link
            rel="stylesheet"
            href="https://cdn.snipcart.com/themes/v3.6.1/default/snipcart.css"
          />
        )}
      </head>
      <body>
        {children}
        {env.useSnipcart && <SnipcartProvider />} {/* client side */}
        {/* DO NOT put <Script src=... onLoad/onError> here */}
      </body>
    </html>
  );
}
