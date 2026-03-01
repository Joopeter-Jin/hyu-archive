//app\profile\page.tsx
import Link from "next/link"
import ProfileClient from "@/components/profile/ProfileClient"

export default async function ProfilePage() {
  return (
    <div className="max-w-5xl mx-auto py-16 px-6 space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-serif font-bold">Profile</h1>
        <Link
          href="/messages"
          className="rounded-xl border border-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900 transition"
        >
          Messages →
        </Link>
      </div>

      <ProfileClient />
    </div>
  )
}