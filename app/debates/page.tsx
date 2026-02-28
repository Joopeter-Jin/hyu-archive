// app/debates/page.tsx
export const dynamic = "force-dynamic"
export const revalidate = 0

import CategoryPage from "@/components/category/CategoryPage"

type SearchParams = Record<string, string | string[] | undefined>

export default async function DebatesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams
}) {
  const sp = searchParams ? await Promise.resolve(searchParams) : undefined

  return (
    <CategoryPage
      category="debates"
      title="Debates"
      description="Dialectical inquiries, objections, and open problems worth pursuing."
      searchParams={sp}
    />
  )
}