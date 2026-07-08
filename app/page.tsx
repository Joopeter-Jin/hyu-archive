// app/page.tsx
import { prisma } from "@/lib/prisma"
import HomeHero from "@/components/home/HomeHero"
import CoreQuestions from "@/components/home/CoreQuestions"
import ArchiveStructure from "@/components/home/ArchiveStructure"
import LatestPublications from "@/components/home/LatestPublications"

// ✅ ISR: 60초마다 재생성 + 글 작성/수정/삭제 시 revalidatePath("/")로 즉시 갱신
export const revalidate = 60

function makeExcerptFromHtml(html: string, max = 180) {
  const cleaned = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (!cleaned) return ""
  return cleaned.length > max ? cleaned.slice(0, max).trimEnd() + "…" : cleaned
}

export default async function HomePage() {
  const latest = await prisma.post.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      createdAt: true,
    },
  })

  const posts = latest.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    createdAt: p.createdAt,
    excerpt: makeExcerptFromHtml(p.content),
  }))

  return (
    <main className="w-full px-6 py-12 space-y-16 max-w-5xl mx-auto lg:mx-0">
      {/* Ⅰ. Abstract */}
      <HomeHero />

      {/* Ⅱ. Core Questions */}
      <CoreQuestions />

      {/* Ⅲ. Archive Structure */}
      <ArchiveStructure />

      {/* Ⅳ. Latest Publications */}
      <LatestPublications posts={posts} />
    </main>
  )
}
