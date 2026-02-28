//app/debates/page.tsx
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
      category="debates"
      title="Debates"
      description="Dialectical inquiries, objections, and open problems worth pursuing."
      searchParams={searchParams}
    />
  )
}