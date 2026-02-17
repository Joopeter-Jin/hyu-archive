import WriteButton from "@/components/WriteButton"

type Props = {
  title: string
  description: string
  writeHref: string
  children: React.ReactNode
}

export default function CategoryLayout({
  title,
  description,
  writeHref,
  children,
}: Props) {
  return (
    <div className="w-full max-w-5xl px-8 py-14 space-y-10">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-serif font-bold tracking-tight">
            {title}
          </h1>
          <p className="text-neutral-400 max-w-2xl">
            {description}
          </p>
        </div>

        <WriteButton href={writeHref} />
      </div>

      {children}
    </div>
  )
}
