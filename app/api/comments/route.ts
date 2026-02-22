// app/api/comments/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import type { Role } from "@prisma/client"

type CommentNode = {
  id: string
  postId: string
  parentId: string | null
  content: string
  authorId: string
  createdAt: Date
  updatedAt: Date
  author: {
    id: string
    name: string | null
    image: string | null
    profile: { displayName: string; role: Role } | null
  }
  replies: CommentNode[]
}

function buildTree(flat: Omit<CommentNode, "replies">[]): CommentNode[] {
  const map = new Map<string, CommentNode>()
  const roots: CommentNode[] = []

  for (const c of flat) {
    map.set(c.id, { ...c, replies: [] })
  }

  for (const c of map.values()) {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(c)
    } else {
      roots.push(c)
    }
  }

  // 보기 좋게 정렬(오래된 순)
  const sortRec = (nodes: CommentNode[]) => {
    nodes.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    nodes.forEach((n) => sortRec(n.replies))
  }
  sortRec(roots)

  return roots
}

async function getAuthUser() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  return { session, userId }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const postId = searchParams.get("postId")?.trim()

  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 })
  }

  // flat 조회 후 트리 변환
  const flat = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      postId: true,
      parentId: true,
      content: true,
      isDeleted: true,
      deletedAt: true,
      authorId: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: {
            select: {
              displayName: true,
              role: true,
            },
          },
        },
      },
    },
  })

  const tree = buildTree(flat as any)
  return NextResponse.json(tree, { status: 200 })
}

export async function POST(req: Request) {
  const { userId } = await getAuthUser()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const postId = String(body.postId ?? "").trim()
  const content = String(body.content ?? "")
  const parentIdRaw = body.parentId ?? null
  const parentId = parentIdRaw ? String(parentIdRaw) : null

  if (!postId) return NextResponse.json({ error: "postId is required" }, { status: 400 })
  if (!content.trim()) return NextResponse.json({ error: "content is required" }, { status: 400 })

  // parentId가 있으면: 같은 post인지 검증
  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true, postId: true },
    })
    if (!parent) return NextResponse.json({ error: "Parent comment not found" }, { status: 404 })
    if (parent.postId !== postId) {
      return NextResponse.json({ error: "parentId does not belong to postId" }, { status: 400 })
    }
  }

  const created = await prisma.comment.create({
    data: {
      postId,
      parentId,
      content,
      authorId: userId,
    },
    select: {
      id: true,
      postId: true,
      parentId: true,
      content: true,
      isDeleted: true,
      deletedAt: true,
      authorId: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: { select: { displayName: true, role: true } },
        },
      },
    },
  })

  return NextResponse.json(created, { status: 201 })
}