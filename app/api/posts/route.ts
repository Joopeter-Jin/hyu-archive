// app/api/posts/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMeWithRole, canManageCategory } from "@/lib/acl"

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
      attachments: { select: { id: true } },
    },
  })

  return NextResponse.json(posts, { status: 200 })
}

export async function POST(req: Request) {
  try {
    // ✅ 로그인 + role
    const me = await getMeWithRole()
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({} as any))
    const title = asString(body.title).trim()
    const content = asString(body.content)
    const category = asString(body.category).trim()

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 })
    if (!category) return NextResponse.json({ error: "Category is required" }, { status: 400 })

    // ✅ 카테고리 권한 체크 (작성/수정/삭제 동일)
    if (!canManageCategory(me.role, category)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const rawAttachments = Array.isArray(body.attachments) ? body.attachments : []
    const attachments: AttachmentDTO[] = rawAttachments
      .filter(isAttachment)
      .map((a: AttachmentDTO) => ({
        url: String(a.url),
        fileName: String(a.fileName),
        mimeType: a.mimeType ? String(a.mimeType) : "application/octet-stream",
        size: typeof a.size === "number" && Number.isFinite(a.size) ? a.size : 0,
      }))

    const created = await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: { title, content, category, authorId: me.id },
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