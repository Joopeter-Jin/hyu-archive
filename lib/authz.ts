// lib/authz.ts
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export type Role = "ADMIN" | "PROFESSOR" | "GRAD" | "CONTRIBUTOR" | "USER"

export async function requireUser() {
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

export function hasRole(me: { role: Role } | null, allowed: Role[]) {
  if (!me) return false
  if (me.role === "ADMIN") return true
  return allowed.includes(me.role)
}