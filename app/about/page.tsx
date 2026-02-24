export const dynamic = "force-dynamic"
export const revalidate = 0

import CategoryPage from "@/components/category/CategoryPage"

export default function AboutPage() {
  return (
    <CategoryPage
      category="about"
      title="About Us"
      description="Identity, governance, and institutional reflections of the archive."
    />
  )
}