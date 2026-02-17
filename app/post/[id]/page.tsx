import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

interface Props {
  params: { id: string }
}

export default async function PostDetail({ params }: Props) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
  })

  if (!post) return notFound()

  return (
    <div className="max-w-3xl mx-auto py-16 px-6 space-y-6">
      <h1 className="text-4xl font-serif">{post.title}</h1>

      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  )
}
