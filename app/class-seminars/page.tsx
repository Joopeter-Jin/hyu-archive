//app/class-seminars/page.tsx
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
      category="class-seminars"
      title="Class Seminars"
      description="Class materials, seminar summaries, and research discussions."
      searchParams={searchParams}
    />
  )
}