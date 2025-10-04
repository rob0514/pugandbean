import type { NextConfig } from "next";
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
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
