// app/post/[id]/page.tsx
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import PostActions from "@/components/PostActions"
import Comments from "@/components/comments/Comments"
import VoteButtons from "@/components/votes/VoteButtons"

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
      },
    })
    .catch(() => null)

  if (!post) return notFound()

  const isOwner = !!userId && userId === post.authorId

  // (선택) 서버 렌더링에서 locale 흔들림 줄이고 싶으면 고정 포맷 사용
  const createdAtText = new Date(post.createdAt).toISOString().replace("T", " ").slice(0, 16)

  return (
    <div className="max-w-4xl mx-auto py-16 px-6 space-y-10">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-bold">{post.title}</h1>
            <div className="text-sm text-neutral-500">
              {createdAtText} · {post.category} · views {post.views}
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
        <VoteButtons type="POST" targetId={post.id} />
    </div>
  )
}