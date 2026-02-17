import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

function getEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is missing`)
  return v
}

function supabaseAnon() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  )
}

function supabaseAdmin() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY")
  )
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")

    const sb = supabaseAnon()
    let query = sb
      .from("posts")
      .select("id,title,category,created_at,author_id")
      .order("created_at", { ascending: false })

    if (category) query = query.eq("category", category)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const title = (body?.title ?? "").trim()
    const content = (body?.content ?? "").trim()
    const category = (body?.category ?? "").trim()

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "title, content, category are required" },
        { status: 400 }
      )
    }

    const sb = supabaseAdmin()
    const author_id = session.user.id

    const { data, error } = await sb
      .from("posts")
      .insert([{ title, content, category, author_id }])
      .select("id")
      .single()

    if (error) {
      console.error("Supabase insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (e: any) {
    console.error("POST /api/posts fatal:", e)
    return NextResponse.json({ error: e?.message ?? "Internal Server Error" }, { status: 500 })
  }
}
