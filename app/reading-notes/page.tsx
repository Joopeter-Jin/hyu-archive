// app/reading-notes/page.tsx
export const dynamic = "force-dynamic"
export const revalidate = 0

import CategoryPage from "@/components/category/CategoryPage"

type SearchParams = Record<string, string | string[] | undefined>

export default async function ReadingNotesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams
}) {
  const sp = searchParams ? await Promise.resolve(searchParams) : undefined

  return (
    <CategoryPage
      category="reading-notes"
      title="Reading Notes"
      description="Annotations, reviews, and structured notes on books, papers, and lectures."
      searchParams={sp}
    />
  )
}