//app\admin\score\page.tsx
import { redirect } from "next/navigation"
import { getMeWithRole } from "@/lib/acl"
import AdminScoreCandidatesClient from "@/components/admin/AdminScoreCandidatesClient"

export default async function AdminScorePage() {
  const me = await getMeWithRole()
  if (!me) redirect("/")
  if (me.role !== "ADMIN") redirect("/")

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Contributor Lv5 Candidates</h1>
        <p className="text-sm text-neutral-500 mt-1">
          coreCandidate(90d) 기준 후보를 조회하고, 승인 시 contributorLevel=5로 확정합니다. (Role은 변경하지 않음)
        </p>
      </div>

      <AdminScoreCandidatesClient />
    </div>
  )
}