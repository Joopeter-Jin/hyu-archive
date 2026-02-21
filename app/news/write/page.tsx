import { Suspense } from "react"
import WriteClient from "./WriteClient"

export const dynamic = "force-dynamic"

export default function WritePage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto py-16 px-6 text-neutral-400">Loading editor…</div>}>
      <WriteClient />
    </Suspense>
  )
}