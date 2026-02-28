//app/news/page.tsx
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
      category="news"
      title="News"
      description="Curated events and interpretive essays grounded in monetary and institutional analysis."
      searchParams={searchParams}
    />
  )
}