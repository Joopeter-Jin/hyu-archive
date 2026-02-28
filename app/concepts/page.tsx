//app/concepts/page.tsx
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
      category="concepts"
      title="Concepts"
      description="Core concepts and definitions for monetary philosophy and cryptographic institutions."
      searchParams={searchParams}
    />
  )
}