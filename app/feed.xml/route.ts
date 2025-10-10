import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/mdx/adapter";

export const dynamic = "force-static";

export async function GET() {
  const posts = (await getAllPosts()).slice(0, 20);
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const items = posts.map(p => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${new URL(p.url, base).toString()}</link>
      <guid>${new URL(p.url, base).toString()}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description><![CDATA[${p.excerpt}]]></description>
    </item>
  `).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Pug &amp; Bean</title>
  <link>${base}</link>
  <description>Little dogs. Big life.</description>
  ${items}
</channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "s-maxage=300, stale-while-revalidate" },
  });
}
