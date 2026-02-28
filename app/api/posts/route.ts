// app/api/posts/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

type AttachmentDTO = {
  url: string
  fileName: string
  mimeType?: string | null
  size?: number | null
}

function asString(v: unknown) {
  return typeof v === "string" ? v : ""
}

function isAttachment(x: any): x is AttachmentDTO {
  return (
    x &&
    typeof x === "object" &&
    typeof x.url === "string" &&
    x.url.length > 0 &&
    typeof x.fileName === "string" &&
    x.fileName.length > 0
  )
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category") || undefined

  const posts = await prisma.post.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      createdAt: true,
      authorId: true,
      views: true,
      author: {
        select: {
          id: true,
          name: true,
          profile: { select: { displayName: true, role: true } },
        },
      },
      // ✅ 목록에서도 첨부 존재 여부 정도는 알 수 있게(원하면 제거 가능)
      attachments: { select: { id: true } },
    },
  })

  return NextResponse.json(posts, { status: 200 })
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    // ✅ email로 DB user 확정 (FK 안전)
    const email = session?.user?.email ?? null
    if (!email) {
      return NextResponse.json({ error: "Unauthorized (no email)" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (!dbUser?.id) {
      return NextResponse.json(
        { error: "Unauthorized (user not found in DB)" },
        { status: 401 }
      )
    }
    const userId = dbUser.id

    const body = await req.json().catch(() => ({} as any))
    const title = asString(body.title).trim()
    const content = asString(body.content)
    const category = asString(body.category).trim()

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 })
    if (!category) return NextResponse.json({ error: "Category is required" }, { status: 400 })

    const rawAttachments = Array.isArray(body.attachments) ? body.attachments : []
    const attachments: AttachmentDTO[] = rawAttachments
      .filter(isAttachment)
      .map((a: AttachmentDTO) => ({
        url: String(a.url),
        fileName: String(a.fileName),
        mimeType: a.mimeType ? String(a.mimeType) : "application/octet-stream",
        size: typeof a.size === "number" && Number.isFinite(a.size) ? a.size : 0,
      }))

    // ✅ 글 + 첨부 + job enqueue를 트랜잭션으로 묶으면 더 안전
    const created = await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: { title, content, category, authorId: userId },
        select: { id: true, category: true },
      })

      if (attachments.length > 0) {
        await tx.attachment.createMany({
          data: attachments.map((a) => ({
            postId: post.id,
            url: a.url,
            fileName: a.fileName,
            mimeType: a.mimeType ?? "application/octet-stream",
            size: Number(a.size ?? 0),
          })),
        })
      }

      // ✅ 구독자가 있으면 job enqueue (단순화: postId만)
      const subCount = await tx.subscription.count({
        where: { category: post.category, active: true, channel: "EMAIL" },
      })
      if (subCount > 0) {
        await tx.notificationJob.create({ data: { postId: post.id, category: post.category } })
      }

      return post
    })

    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    console.error("[POST /api/posts] error:", e)
    return NextResponse.json(
      { error: "Internal Server Error", detail: String(e?.message ?? e) },
      { status: 500 }
    )
  }
}