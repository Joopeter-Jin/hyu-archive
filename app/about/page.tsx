// app/about/page.tsx
export const dynamic = "force-dynamic"
export const revalidate = 0

import CategoryPage from "@/components/category/CategoryPage"

type SearchParams = Record<string, string | string[] | undefined>

export default async function AboutPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams
}) {
  const sp = searchParams ? await Promise.resolve(searchParams) : undefined

  return (
    <CategoryPage
      category="about"
      title="About Us"
      description="Identity, governance, and institutional reflections of the archive."
      searchParams={sp}
    />
  )
}