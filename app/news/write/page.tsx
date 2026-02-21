import WriteClient from "./WriteClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function WritePage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {}
  const edit =
    typeof sp.edit === "string"
      ? sp.edit
      : Array.isArray(sp.edit)
        ? sp.edit[0]
        : undefined

  return <WriteClient category="news" editId={edit} />
}