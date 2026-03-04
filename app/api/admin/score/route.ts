//app\api\admin\score\route.ts
import { NextResponse } from "next/server"
import { getMeWithRole } from "@/lib/acl"
import { runScoreRebuild90d } from "@/lib/score-jobs"

export async function POST() {
  const me = await getMeWithRole()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (me.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const result = await runScoreRebuild90d()
  return NextResponse.json({ ok: true, ...result }, { status: 200 })
}