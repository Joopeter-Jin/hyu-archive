// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma" // ✅ 싱글톤 사용

async function ensureUniqueDisplayName(base: string) {
  const normalized =
    base
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 30) || "Anonymous"

  const exists = await prisma.userProfile.findUnique({
    where: { displayName: normalized },
  })
  if (!exists) return normalized

  for (let i = 2; i <= 50; i++) {
    const candidate = `${normalized} ${i}`.slice(0, 30)
    const e = await prisma.userProfile.findUnique({
      where: { displayName: candidate },
    })
    if (!e) return candidate
  }

  const token = Math.random().toString(36).slice(2, 6)
  return `${normalized} ${token}`.slice(0, 30)
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true

      const userId = (user as any)?.id as string | undefined

      const dbUser =
        userId
          ? await prisma.user.findUnique({
              where: { id: userId },
              select: { id: true, name: true, email: true },
            })
          : user.email
          ? await prisma.user.findUnique({
              where: { email: user.email },
              select: { id: true, name: true, email: true },
            })
          : null

      if (!dbUser) return true

      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId: dbUser.id },
        select: { displayName: true },
      })

      const googleName =
        (profile as any)?.name || dbUser.name || user.name || ""

      if (!existingProfile) {
        const displayName = await ensureUniqueDisplayName(
          googleName || "Anonymous"
        )
        await prisma.userProfile.create({
          data: {
            userId: dbUser.id,
            displayName,
          },
        })
      } else if (!existingProfile.displayName?.trim()) {
        const displayName = await ensureUniqueDisplayName(
          googleName || "Anonymous"
        )
        await prisma.userProfile.update({
          where: { userId: dbUser.id },
          data: { displayName },
        })
      }

      return true
    },

    async jwt({ token, user }) {
      if ((user as any)?.id) token.sub = (user as any).id
      return token
    },

    async session({ session, token }) {
      if (session.user && token?.sub) {
        ;(session.user as any).id = token.sub
      }
      return session
    },

    // ✅ 추가: callbackUrl 안전하게 처리(동일 도메인만 허용)
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url
      if (url.startsWith("/")) return `${baseUrl}${url}`
      return baseUrl
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }