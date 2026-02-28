// app/rss/[category]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function esc(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ category: string }> }
) {
  const { category } = await ctx.params

  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000"

  const posts = await prisma.post.findMany({
    where: { category },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, title: true, createdAt: true },
  })

  const now = new Date().toUTCString()

  const items = posts
    .map((p) => {
      const link = `${site}/post/${p.id}`
      return `
  <item>
    <title>${esc(p.title)}</title>
    <link>${esc(link)}</link>
    <guid isPermaLink="true">${esc(link)}</guid>
    <pubDate>${new Date(p.createdAt).toUTCString()}</pubDate>
  </item>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${esc(`HYU Archive - ${category}`)}</title>
  <link>${esc(`${site}/${category}`)}</link>
  <description>${esc(`Latest posts in ${category}`)}</description>
  <lastBuildDate>${now}</lastBuildDate>
  ${items}
</channel>
</rss>`

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}