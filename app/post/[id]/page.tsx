import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function PostPage(props: any) {
  const id = props?.params?.id as string | undefined
  if (!id) return notFound()

  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      createdAt: true,
      authorId: true,
    },
  })

  if (!post) return notFound()

  return (
    <div className="py-12 px-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-serif font-bold">{post.title}</h1>
        <div className="text-sm text-neutral-500">
          {new Date(post.createdAt).toLocaleString()} · {post.category}
        </div>
      </div>

      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  )
}
