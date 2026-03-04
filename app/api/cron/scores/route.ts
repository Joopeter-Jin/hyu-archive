//app\api\cron\scores\route.ts
import { NextResponse } from "next/server"
import { runScoreRebuild90d } from "@/lib/score-jobs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  if (!key || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const result = await runScoreRebuild90d()
  return NextResponse.json({ ok: true, ...result }, { status: 200 })
}