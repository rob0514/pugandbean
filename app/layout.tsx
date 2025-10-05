import './globals.css'
import Script from 'next/script'
import { DM_Serif_Display, Inter, Poppins } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CartProvider } from '@/lib/cart'
import { env } from '@/lib/env'
//import SnipcartProvider from '@/components/payments/SnipcartProvider'

const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400', variable: '--font-dm-serif' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const poppins = Poppins({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600'],
    variable: '--font-poppins'
})

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
    title: {
        default: 'Pug & Bean — Little dogs. Big life.',
        template: '%s · Pug & Bean'
    },
    description: 'Smarter care. Stylish living. For little dogs with big lives.',
    openGraph: {
        type: 'website',
        title: 'Pug & Bean',
        description: 'Smarter care. Stylish living.',
        siteName: 'Pug & Bean'
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Pug & Bean',
        description: 'Smarter care. Stylish living.'
    }
}

export const viewport: Viewport = {
    themeColor: '#FAF8F5'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${dmSerif.variable} ${inter.variable} ${poppins.variable}`}>
            <head>
                    <Script id="snipcart-settings" strategy="beforeInteractive">
                        {`window.SnipcartSettings = {
              publicApiKey: "${env.snipcartPublicKey}",
              loadStrategy: "always"
            };`}
                    </Script>
            </head>
            <body className="min-h-screen flex flex-col">
                <CartProvider>
                    <SiteHeader />
                    <main className="flex-1">
                        {children}
                        <Script
          id="snipcart-runtime"
          src="https://cdn.snipcart.com/themes/v3.6.1/default/snipcart.js"
          strategy="afterInteractive"
          onLoad={() => {
            console.log("[snipcart] runtime loaded", !!window.Snipcart);
            document.addEventListener("snipcart.ready", () =>
              console.log("[snipcart] ready event fired")
            );
          }}
          onError={(e) => console.error("[snipcart] runtime load error", e)}
        />
                    </main>
                    <SiteFooter />
                </CartProvider>
            </body>
        </html>
    )
}
