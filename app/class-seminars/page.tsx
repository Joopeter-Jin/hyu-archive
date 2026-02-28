// app/class-seminars/page.tsx
export const dynamic = "force-dynamic"
export const revalidate = 0

import CategoryPage from "@/components/category/CategoryPage"

type SearchParams = Record<string, string | string[] | undefined>

export default async function ClassSeminarsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams
}) {
  const sp = searchParams ? await Promise.resolve(searchParams) : undefined

  return (
    <CategoryPage
      category="class-seminars"
      title="Class Seminars"
      description="Class materials, seminar summaries, and research discussions."
      searchParams={sp}
    />
  )
}