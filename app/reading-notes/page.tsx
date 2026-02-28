//app/reading-notes/page.tsx
export const dynamic = "force-dynamic"
export const revalidate = 0

import CategoryPage from "@/components/category/CategoryPage"

export default function ReadingNotesPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  return (
    <CategoryPage
      category="reading-notes"
      title="Reading Notes"
      description="Annotations, reviews, and structured notes on books, papers, and lectures."
      searchParams={searchParams}
    />
  )
}