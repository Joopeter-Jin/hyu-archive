// lib/authz.ts
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { NextResponse } from "next/server"

export type Role = "ADMIN" | "PROFESSOR" | "GRAD" | "CONTRIBUTOR" | "USER"

/**
 * 로그인한 유저 + role을 가져온다.
 * 없으면 null
 */
export async function requireUser(): Promise<{ id: string; role: Role } | null> {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return null

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, profile: { select: { role: true } } },
  })
  if (!me) return null

  const role = (me.profile?.role ?? "USER") as Role
  return { id: me.id, role }
}

/**
 * 역할 체크 헬퍼
 * - ADMIN은 항상 통과
 */
export function hasRole(me: { role: Role } | null, allowed: Role[]) {
  if (!me) return false
  if (me.role === "ADMIN") return true
  return allowed.includes(me.role)
}

/**
 * ADMIN 전용 라우트에서 사용.
 * - 성공: { ok: true, me }
 * - 실패: { ok: false, res } (바로 return auth.res)
 *
 * ✅ 기존 admin 라우트들이 `const auth = await requireAdmin(); if (!auth.ok) return auth.res`
 *    형태로 쓰도록 만들어둔 호환 함수
 */
export async function requireAdmin(): Promise<
  | { ok: true; me: { id: string; role: Role } }
  | { ok: false; res: NextResponse<{ error: string }> }
> {
  const me = await requireUser()
  if (!me) return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  if (me.role !== "ADMIN") return { ok: false, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { ok: true, me }
}