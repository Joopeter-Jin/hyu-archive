//app\api\upload\route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function safeExt(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "bin"
  return ext.replace(/[^a-z0-9]/g, "").slice(0, 12) || "bin"
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  // ✅ 파일 크기 제한(원하면 조절)
  const maxBytes = 25 * 1024 * 1024 // 25MB
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 400 })
  }

  const ext = safeExt(file.name)
  const path = `${userId}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadError } = await supabaseAdmin.storage
    .from("editor-images") // ✅ 통일
    .upload(path, arrayBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data } = supabaseAdmin.storage.from("editor-images").getPublicUrl(path)

  return NextResponse.json(
    {
      url: data.publicUrl,
      fileName: file.name,
      mimeType: file.type || null,
      size: file.size,
    },
    { status: 201 }
  )
}