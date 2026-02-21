import { Suspense } from "react"
import WriteClient from "./WriteClient"

export const dynamic = "force-dynamic"

export default function WritePage() {
  return (
    <Suspense fallback={<div className="p-6 text-neutral-400">Loading...</div>}>
      <WriteClient category="concepts" />
    </Suspense>
  )
}