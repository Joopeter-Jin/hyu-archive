// lib/acl.ts
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export type Role = "ADMIN" | "PROFESSOR" | "GRAD" | "CONTRIBUTOR" | "USER"

export const CATEGORY_ACL: Record<string, Role[]> = {
  "about": ["ADMIN"],
  "class-seminars": ["ADMIN", "PROFESSOR", "GRAD"],
  "news": ["ADMIN", "PROFESSOR", "CONTRIBUTOR"],
  "concepts": ["ADMIN", "PROFESSOR", "GRAD"],
  "debates": ["ADMIN", "PROFESSOR", "GRAD", "CONTRIBUTOR", "USER"],
  "reading-notes": ["ADMIN", "PROFESSOR", "GRAD", "CONTRIBUTOR"],
}

export async function getMeWithRole() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return null

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      profile: { select: { role: true } },
    },
  })
  if (!me) return null

  const role = (me.profile?.role ?? "USER") as Role
  return { id: me.id, role }
}

export function canManageCategory(role: Role, category: string) {
  if (role === "ADMIN") return true
  const allowed = CATEGORY_ACL[category]
  if (!allowed) return false
  return allowed.includes(role)
}