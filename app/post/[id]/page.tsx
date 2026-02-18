import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ViewCounter from "@/components/ViewCounter"

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const post = await prisma.post.findUnique({
    where: { id },
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

  if (!post) return notFound()

  return (
    <div className="max-w-4xl mx-auto py-16 px-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-serif font-bold">{post.title}</h1>
        <div className="text-sm text-neutral-500">
          {new Date(post.createdAt).toLocaleString()} · {post.category} · Views:{" "}
          <span className="text-neutral-300">{post.views}</span>
        </div>
      </div>

      {/* ✅ 클라이언트에서 1회 조회수 증가 */}
      <ViewCounter postId={post.id} />

      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  )
}
