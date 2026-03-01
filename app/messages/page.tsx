// app/messages/page.tsx
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function MessagesPage() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email ?? null
  if (!email) redirect("/")

  const me = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (!me?.id) redirect("/")

  const threads = await prisma.dMThread.findMany({
    where: { OR: [{ userAId: me.id }, { userBId: me.id }] },
    orderBy: { lastMessageAt: "desc" },
    select: {
      id: true,
      userAId: true,
      userBId: true,
      lastMessageAt: true,
      userA: { select: { id: true, name: true, profile: { select: { displayName: true } } } },
      userB: { select: { id: true, name: true, profile: { select: { displayName: true } } } },
      reads: { select: { userId: true, lastReadAt: true } },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { body: true, createdAt: true, senderId: true },
      },
    },
  })

  // 간단한 unread 계산(스레드 수가 많아지면 최적화 가능)
  const withUnread = await Promise.all(
    threads.map(async (t) => {
      const myRead = t.reads.find((r) => r.userId === me.id)?.lastReadAt ?? new Date(0)
      const unread = await prisma.dMMessage.count({
        where: {
          threadId: t.id,
          createdAt: { gt: myRead },
          senderId: { not: me.id },
        },
      })

      const other =
        t.userAId === me.id ? t.userB : t.userA

      const otherName =
        other.profile?.displayName?.trim() ||
        other.name?.trim() ||
        "User"

      const lastBody = t.messages[0]?.body ?? ""
      return { id: t.id, otherName, otherId: other.id, lastBody, unread, lastMessageAt: t.lastMessageAt }
    })
  )

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-serif font-bold">Messages</h1>
        <div className="text-sm text-neutral-500">Inbox</div>
      </div>

      <div className="space-y-3">
        {withUnread.length === 0 ? (
          <div className="text-neutral-500">No messages yet.</div>
        ) : (
          withUnread.map((t) => (
            <Link
              key={t.id}
              href={`/messages/${t.id}`}
              className="block rounded-xl border border-neutral-800 bg-black/30 p-4 hover:bg-neutral-900 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.otherName}</div>
                  <div className="mt-1 text-sm text-neutral-400 truncate">
                    {t.lastBody}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="text-xs text-neutral-500">
                    {new Date(t.lastMessageAt).toLocaleString()}
                  </div>
                  {t.unread > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white text-black">
                      {t.unread}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}