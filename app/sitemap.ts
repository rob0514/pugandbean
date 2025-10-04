import type { MetadataRoute } from 'next'


export default function sitemap(): MetadataRoute.Sitemap {
const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
return [
{ url: `${base}/`, priority: 1.0 },
{ url: `${base}/shop` },
{ url: `${base}/blog` },
{ url: `${base}/about` },
{ url: `${base}/contact` },
]
}