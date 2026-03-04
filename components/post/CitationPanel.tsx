//components/post/CitationPanel.tsx
import Link from "next/link"

export default function CitationPanel({
  cited,
  citedBy,
}: {
  cited: Array<{ id: string; title: string }>
  citedBy: Array<{ id: string; title: string }>
}) {
  return (
    <div className="mt-10 space-y-6 border-t border-neutral-800 pt-6">
      <div>
        <div className="text-sm font-semibold mb-2">References</div>
        {cited.length === 0 ? (
          <div className="text-sm text-neutral-500">No references</div>
        ) : (
          cited.map((p) => (
            <Link key={p.id} href={`/post/${p.id}`} className="block text-sm text-neutral-300 hover:text-white">
              {p.title}
            </Link>
          ))
        )}
      </div>

      <div>
        <div className="text-sm font-semibold mb-2">Cited By</div>
        {citedBy.length === 0 ? (
          <div className="text-sm text-neutral-500">No citations yet</div>
        ) : (
          citedBy.map((p) => (
            <Link key={p.id} href={`/post/${p.id}`} className="block text-sm text-neutral-300 hover:text-white">
              {p.title}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}