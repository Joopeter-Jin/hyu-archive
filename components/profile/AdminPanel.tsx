// components/profile/AdminPanel.tsx
"use client"

import { useState } from "react"
import RoleRequestsClient from "@/components/admin/RoleRequestsClient"
import AdminUsersClient from "@/components/admin/AdminUsersClient"
import AdminPostsClient from "@/components/admin/AdminPostsClient"
import AdminCommentsClient from "@/components/admin/AdminCommentsClient"
import AdminVotesClient from "@/components/admin/AdminVotesClient"

type Tab = "roleRequests" | "users" | "posts" | "comments" | "votes"

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("roleRequests")

  const TabBtn = ({ k, label }: { k: Tab; label: string }) => (
    <button
      className={
        "px-3 py-1.5 rounded-lg text-sm border transition " +
        (tab === k
          ? "bg-white text-black border-white"
          : "border-neutral-800 text-neutral-300 hover:bg-neutral-900")
      }
      onClick={() => setTab(k)}
      type="button"
    >
      {label}
    </button>
  )

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
      <div>
        <div className="text-lg font-semibold">Admin</div>
        <div className="text-sm text-neutral-400">Manage users, posts, comments, votes, and role requests.</div>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabBtn k="roleRequests" label="Role Requests" />
        <TabBtn k="users" label="Users" />
        <TabBtn k="posts" label="Posts" />
        <TabBtn k="comments" label="Comments" />
        <TabBtn k="votes" label="Votes" />
      </div>

      <div className="pt-2">
        {tab === "roleRequests" && <RoleRequestsClient />}
        {tab === "users" && <AdminUsersClient />}
        {tab === "posts" && <AdminPostsClient />}
        {tab === "comments" && <AdminCommentsClient />}
        {tab === "votes" && <AdminVotesClient />}
      </div>
    </div>
  )
}