// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

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
    // PrismaAdapter면 보통 database 전략이지만,
    // Vercel/로컬 혼합에서 안정적으로 id를 가져오려면 callbacks로 보강
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      // ✅ 최초 로그인 시 user.id를 token.sub에 확정
      if (user?.id) token.sub = user.id
      return token
    },

    async session({ session, token }) {
      // ✅ token.sub = NextAuth(User.id)
      if (session.user && token?.sub) {
        ;(session.user as any).id = token.sub
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
