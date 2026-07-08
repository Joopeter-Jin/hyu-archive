//app\api\cron\scores\route.ts
import { NextResponse } from "next/server"
import { runScoreRebuild90d } from "@/lib/score-jobs"

export async function GET(req: Request) {
  // ✅ cron 보호: Vercel Cron이 자동으로 보내는 Authorization 헤더 또는 ?key= 쿼리 허용
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  const authHeader = req.headers.get("authorization")
  const authorized =
    !!process.env.CRON_SECRET &&
    (key === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`)
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const result = await runScoreRebuild90d()
  return NextResponse.json({ ok: true, ...result }, { status: 200 })
}
