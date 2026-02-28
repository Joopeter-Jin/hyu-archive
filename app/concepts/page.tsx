// app/concepts/page.tsx
export const dynamic = "force-dynamic"
export const revalidate = 0

import CategoryPage from "@/components/category/CategoryPage"

type SearchParams = Record<string, string | string[] | undefined>

export default async function ConceptsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams
}) {
  const sp = searchParams ? await Promise.resolve(searchParams) : undefined

  return (
    <CategoryPage
      category="concepts"
      title="Concepts"
      description="Core concepts and definitions for monetary philosophy and cryptographic institutions."
      searchParams={sp}
    />
  )
}