import type { NextConfig } from "next";
import createMDX from '@next/mdx';

const csp = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline' https://cdn.snipcart.com https://fonts.bunny.net",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.snipcart.com",
  // add BOTH snipcart hosts + your image origins
  "connect-src 'self' https://app.snipcart.com https://cdn.snipcart.com https://payment.snipcart.com",
  "img-src 'self' data: blob: https://cdn.snipcart.com https://picsum.photos https://fastly.picsum.photos https://picsum.photos",
  "font-src 'self' https://cdn.snipcart.com https://fonts.bunny.net data:",
  "frame-src 'self' https://payment.snipcart.com",
].join("; ");

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [{ key: "Content-Security-Policy", value: csp }],
            },
        ];
    },
    reactStrictMode: true,
    typedRoutes: true,
    experimental: { mdxRs: true },
    pageExtensions: ['ts', 'tsx', 'mdx'],
};

const withMDX = createMDX({
    extension: /\.mdx?$/,
});

//test this

export default withMDX(nextConfig);
