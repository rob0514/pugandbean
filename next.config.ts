/** @type {import('next').NextConfig} */

const csp = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline' https://cdn.snipcart.com https://fonts.bunny.net",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.snipcart.com https://clerk-js.cloudflare.com https://*.clerk.com https://*.clerk.services https://*.clerk.accounts.dev",
  "connect-src 'self' https://app.snipcart.com https://cdn.snipcart.com https://payment.snipcart.com https://clerk-telemetry.com https://*.clerk.com https://*.clerk.services https://api.clerk.com https://*.clerk.accounts.dev",
  "img-src 'self' data: blob: https://cdn.snipcart.com https://picsum.photos https://fastly.picsum.photos https://img.clerk.com https://*.clerk.com https://*.clerk.accounts.dev",
  "font-src 'self' https://cdn.snipcart.com https://fonts.bunny.net data:",
  "frame-src 'self' https://payment.snipcart.com https://*.clerk.com https://*.clerk.accounts.dev",
  "worker-src  'self' blob:",
].join("; ");

const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [{ key: "Content-Security-Policy", value: csp }],
      },
    ];
  },

  images: {
    domains: ["files.cdn.printful.com", "images.printful.com"],
    remotePatterns: [
      { protocol: "https", hostname: "files.cdn.printful.com" },
      { protocol: "https", hostname: "images.printful.com" },
    ],
  },

  reactStrictMode: true,
  typedRoutes: true,

  // We are NOT making .mdx pages; content MDX is compiled server-side.
  // experimental: { mdxRs: true },   // ← remove
  // pageExtensions: ['ts','tsx','mdx'], // ← remove
};

export default nextConfig;
