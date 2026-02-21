import WriteClient from "./WriteClient"

export const dynamic = "force-dynamic"

export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const sp = await searchParams
  return <WriteClient category="class-seminars" editId={sp?.edit ?? null} />
}