// app/post/[id]/page.tsx
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import PostActions from "@/components/PostActions"
import Comments from "@/components/comments/Comments"
import VoteButtons from "@/components/votes/VoteButtons"
import RoleBadge from "@/components/profile/RoleBadge"

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined

  // ✅ 조회수 1 증가 + 포스트 읽기
  const post = await prisma.post
    .update({
      where: { id },
      data: { views: { increment: 1 } },
      select: {
        id: true,
        title: true,
        content: true,
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
      },
    })
    .catch(() => null)

  if (!post) return notFound()

  const isOwner = !!userId && userId === post.authorId
  const authorName =
    post.author.profile?.displayName?.trim() ||
    post.author.name?.trim() ||
    "User"
  const authorRole = post.author.profile?.role ?? "USER"

  return (
    <div className="max-w-4xl mx-auto py-16 px-6 space-y-10">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-bold">{post.title}</h1>

            <div className="text-sm text-neutral-500 flex flex-wrap items-center gap-2">
              <span>{new Date(post.createdAt).toLocaleString()}</span>
              <span>·</span>
              <span>{post.category}</span>
              <span>·</span>
              <span>views {post.views}</span>
              <span>·</span>
              <span className="text-neutral-300">{authorName}</span>
              <RoleBadge role={authorRole} />
            </div>

            {/* ✅ Vote UI (POST) */}
            <div className="pt-2">
              <VoteButtons type="POST" targetId={post.id} />
            </div>
          </div>

          {/* ✅ 작성자만 보이는 액션 */}
          {isOwner ? (
            <PostActions postId={post.id} category={post.category} />
          ) : (
            <div className="text-xs text-neutral-600">You can view only.</div>
          )}
        </div>
      </header>

      {/* Body */}
      <article
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* ✅ Comments */}
      <Comments postId={post.id} />
    </div>
  )
}