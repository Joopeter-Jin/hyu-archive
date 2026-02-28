// components/auth/InAppLoginGuard.tsx
"use client"

import { useMemo, useState } from "react"
import { copyToClipboard, isInAppBrowser, isIOS, openInChromeIntent } from "@/lib/inapp"

type Props = {
  onContinue: () => void // 인앱이 아닐 때 실제 signIn 호출
}

export default function InAppLoginGuard({ onContinue }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : ""
  const inApp = useMemo(() => isInAppBrowser(ua), [ua])
  const ios = useMemo(() => isIOS(ua), [ua])

  const handleLogin = async () => {
    if (!inApp) {
      onContinue()
      return
    }

    // 인앱이면 모달을 띄워서 유도
    setOpen(true)
  }

  const handleOpenExternal = () => {
  // ✅ 현재 보고 있던 페이지를 외부 브라우저로 연다
  const current = window.location.href

  if (ios) {
    // iOS 인앱 → 새 탭(사파리에서 열기 유도)
    window.open(current, "_blank", "noopener,noreferrer")
  } else {
    // Android 인앱 → Chrome intent로 현재 페이지를 연다
    openInChromeIntent(current)
  }
}

  const handleCopy = async () => {
    const ok = await copyToClipboard(window.location.href)
    setCopied(ok)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <>
      <button
        onClick={handleLogin}
        className="text-sm text-neutral-400 hover:text-white transition"
      >
        Login
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
            <div className="text-base font-serif text-neutral-100">
              외부 브라우저에서 로그인 필요
            </div>

            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              카카오톡/인스타 등 앱 내 브라우저에서는 Google 로그인 정책상 차단될 수 있습니다.
              아래 버튼을 눌러 Chrome/Safari에서 현재 페이지를 연 뒤 로그인하면,
              로그인 후 다시 이 페이지로 돌아옵니다.
            </p>

            <div className="mt-4 space-y-2 text-xs text-neutral-500">
              <div>에러 코드: 403 disallowed_useragent</div>
              {ios ? (
                <div>
                  iOS: 우측 상단 메뉴(⋯/공유) → <span className="text-neutral-300">Safari에서 열기</span>
                </div>
              ) : (
                <div>
                  Android: 아래 버튼을 누르면 <span className="text-neutral-300">Chrome</span>으로 열립니다.
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleOpenExternal}
                className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-200 transition"
              >
                {ios ? "새 탭으로 열기" : "Chrome에서 열기"}
              </button>

              <button
                onClick={handleCopy}
                className="inline-flex items-center rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900 transition"
              >
                {copied ? "URL 복사됨" : "URL 복사"}
              </button>

              <button
                onClick={() => setOpen(false)}
                className="inline-flex items-center rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900 transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}