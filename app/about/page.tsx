//app/about/page.tsx
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
      category="about"
      title="About Us"
      description="Identity, governance, and institutional reflections of the archive."
      searchParams={searchParams}
    />
  )
}