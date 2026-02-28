// app/rss.xml/route.ts
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

function escapeXml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

function getBaseUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL
  if (site) return site.replace(/\/$/, "")
  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`
  return "http://localhost:3000"
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")?.trim() || null

  const baseUrl = getBaseUrl()
  const title = category
    ? `HYU Crypto Philosophy Archive — ${category}`
    : "HYU Crypto Philosophy Archive"

  const feedUrl = category
    ? `${baseUrl}/rss.xml?category=${encodeURIComponent(category)}`
    : `${baseUrl}/rss.xml`

  const posts = await prisma.post.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      createdAt: true,
      author: {
        select: {
          name: true,
          profile: { select: { displayName: true } },
        },
      },
      attachments: {
        select: { url: true, fileName: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  const items = posts
    .map((p) => {
      const link = `${baseUrl}/post/${p.id}`
      const author =
        p.author.profile?.displayName?.trim() ||
        p.author.name?.trim() ||
        "Unknown"

      const excerpt = stripHtml(p.content).slice(0, 280)
      const attachmentHtml = p.attachments?.length
        ? `<br/><br/>Attachments:<br/>` +
          p.attachments
            .slice(0, 10)
            .map((a) => `- <a href="${escapeXml(a.url)}">${escapeXml(a.fileName)}</a>`)
            .join("<br/>")
        : ""

      return `
  <item>
    <title>${escapeXml(p.title)}</title>
    <link>${escapeXml(link)}</link>
    <guid isPermaLink="true">${escapeXml(link)}</guid>
    <pubDate>${new Date(p.createdAt).toUTCString()}</pubDate>
    <category>${escapeXml(p.category)}</category>
    <author>${escapeXml(author)}</author>
    <description><![CDATA[${escapeXml(excerpt)}${attachmentHtml}]]></description>
  </item>
      `.trim()
    })
    .join("\n")

  const lastBuildDate = posts[0]?.createdAt
    ? new Date(posts[0].createdAt).toUTCString()
    : new Date().toUTCString()

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>${escapeXml(title)}</title>
  <link>${escapeXml(baseUrl)}</link>
  <description>${escapeXml("New posts from HYU Crypto Philosophy Archive")}</description>
  <language>en</language>
  <lastBuildDate>${lastBuildDate}</lastBuildDate>
  <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
</channel>
</rss>`

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}