// app/post/[id]/page.tsx
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import PostActions from "@/components/PostActions"

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined

  // ✅ 조회수 1 증가 + 포스트 읽기
  const post = await prisma.post.update({
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
  }).catch(() => null)

  if (!post) return notFound()

  const isOwner = !!userId && userId === post.authorId

  return (
    <div className="max-w-4xl mx-auto py-16 px-6 space-y-8">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-bold">{post.title}</h1>
            <div className="text-sm text-neutral-500">
              {new Date(post.createdAt).toLocaleString()} · {post.category} · views {post.views}
            </div>
          </div>

          {/* ✅ 작성자만 보이는 액션 */}
          {isOwner ? (
            <PostActions postId={post.id} category={post.category} />
          ) : (
            <div className="text-xs text-neutral-600">You can view only.</div>
          )}
        </div>
      </div>

      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  )
}