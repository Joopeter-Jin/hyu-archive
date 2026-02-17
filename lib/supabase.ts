import { createClient } from "@supabase/supabase-js"

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error("Supabase env variables are missing")
  }

  return { url, key }
}

/**
 * Server Component / RSC에서 사용하는 anon client (읽기 전용)
 * - 호출할 때마다 새 client를 만듦
 */
export function getSupabaseAnon() {
  const { url, key } = getEnv()
  return createClient(url, key)
}

/**
 * 공용(상수) anon client
 * - 기존 코드들 호환용
 */
export const supabaseAnon = (() => {
  const { url, key } = getEnv()
  return createClient(url, key)
})()
