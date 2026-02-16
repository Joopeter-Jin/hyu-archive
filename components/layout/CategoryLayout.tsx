interface CategoryLayoutProps {
  title: string
  description: string
}

export default function CategoryLayout({
  title,
  description,
}: CategoryLayoutProps) {
  return (
    <div className="max-w-4xl space-y-10">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">
            {title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {description}
          </p>
        </div>

        {/* 🔥 나중에 로그인 조건부 렌더링 예정 */}
        <button className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition">
          Write Post
        </button>
      </div>

      {/* Post List Placeholder */}
      <div className="space-y-4">
        <div className="p-4 border border-border rounded-lg hover:bg-accent transition">
          Sample Post Title 1
        </div>

        <div className="p-4 border border-border rounded-lg hover:bg-accent transition">
          Sample Post Title 2
        </div>
      </div>
    </div>
  )
}
