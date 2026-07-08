import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // ✅ next/image 외부 이미지 허용: Google OAuth 아바타 + Supabase Storage
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    // ✅ 클라이언트 라우터 캐시: 뒤로가기/재방문 시 30초 동안 서버 재요청 없이 즉시 표시
    // (글 작성/수정/삭제 후에는 router.refresh()가 캐시를 비우므로 항상 최신 상태)
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
