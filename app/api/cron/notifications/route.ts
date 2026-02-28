// app/api/cron/notifications/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import { buildNewPostEmail } from "@/lib/emailTemplates"

export const dynamic = "force-dynamic"
export const revalidate = 0

const resend = new Resend(process.env.RESEND_API_KEY!)

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function getBaseUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL
  if (site) return site.replace(/\/$/, "")
  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`
  return "http://localhost:3000"
}

export async function GET(req: Request) {
  // ✅ cron 보호용 키(권장)
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  if (process.env.CRON_SECRET && key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY missing" }, { status: 500 })
  }
  if (!process.env.NOTIFY_FROM_EMAIL) {
    return NextResponse.json({ error: "NOTIFY_FROM_EMAIL missing" }, { status: 500 })
  }

  const baseUrl = getBaseUrl()

  // ✅ 한번에 너무 많이 보내지 않기
  const jobs = await prisma.notificationJob.findMany({
    where: { processed: false },
    orderBy: { createdAt: "asc" },
    take: 10,
    select: { id: true, postId: true, category: true },
  })

  let sent = 0

  for (const job of jobs) {
    const post = await prisma.post.findUnique({
      where: { id: job.postId },
      select: { id: true, title: true, category: true, createdAt: true },
    })

    // post가 삭제된 경우: job 처리완료로 넘김
    if (!post) {
      await prisma.notificationJob.update({
        where: { id: job.id },
        data: { processed: true, processedAt: new Date() },
      })
      continue
    }

    // 구독자 이메일 수집
    const subs = await prisma.subscription.findMany({
      where: { category: job.category, channel: "EMAIL", active: true },
      select: { user: { select: { email: true } } },
    })

    const emails = subs.map((s) => s.user.email).filter(Boolean) as string[]
    if (emails.length === 0) {
      await prisma.notificationJob.update({
        where: { id: job.id },
        data: { processed: true, processedAt: new Date() },
      })
      continue
    }

    const link = `${baseUrl}/post/${post.id}`

    await resend.emails.send({
  from: process.env.NOTIFY_FROM_EMAIL!,
  to: emails,
  subject: `[${post.category}] ${post.title}`,
  html: `
  <div style="background:#0b0b0b;padding:24px">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
      style="max-width:640px;margin:0 auto;background:#111;border:1px solid #262626;border-radius:14px;overflow:hidden">
      <tr>
        <td style="padding:18px 20px;border-bottom:1px solid #262626">
          <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#fff;font-size:16px;font-weight:700">
            Crypto Philosophy Archive
          </div>
          <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#9ca3af;font-size:12px;margin-top:6px">
            New post notification
          </div>
        </td>
      </tr>

      <tr>
        <td style="padding:18px 20px">
          <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin-bottom:10px">
            <span style="display:inline-block;background:#1f2937;color:#e5e7eb;font-size:12px;padding:4px 10px;border-radius:999px;border:1px solid #374151">
              ${post.category}
            </span>
            <span style="color:#6b7280;font-size:12px;margin-left:10px">
              ${new Date(post.createdAt).toLocaleString()}
            </span>
          </div>

          <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#fff;font-size:20px;font-weight:800;line-height:1.3">
            ${escapeHtml(post.title)}
          </div>

          <div style="margin-top:16px">
            <a href="${link}"
              style="display:inline-block;background:#fff;color:#000;text-decoration:none;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:14px;font-weight:700;padding:10px 14px;border-radius:10px">
              Read the post →
            </a>
          </div>

          <div style="margin-top:16px;color:#9ca3af;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:12px;line-height:1.6">
            If the button doesn’t work, open this link:<br/>
            <a href="${link}" style="color:#93c5fd;text-decoration:underline">${link}</a>
          </div>

          <div style="margin-top:18px;padding-top:14px;border-top:1px solid #262626;color:#9ca3af;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:12px">
            RSS for this category:
            <a href="${baseUrl}/rss.xml?category=${encodeURIComponent(post.category)}"
              style="color:#93c5fd;text-decoration:underline">
              ${baseUrl}/rss.xml?category=${escapeHtml(post.category)}
            </a>
          </div>
        </td>
      </tr>

      <tr>
        <td style="padding:14px 20px;border-top:1px solid #262626;color:#6b7280;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:11px">
          You received this email because you subscribed to category updates.
        </td>
      </tr>
    </table>
  </div>
  `,
})

    await prisma.notificationJob.update({
      where: { id: job.id },
      data: { processed: true, processedAt: new Date() },
    })

    sent++
  }

  return NextResponse.json({ ok: true, jobs: jobs.length, sent }, { status: 200 })
}