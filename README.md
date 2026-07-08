# HYU Crypto Philosophy Archive

> 암호화폐와 화폐의 본질을 연구하고 기록하는 학술 아카이브.
> An academic archive dedicated to the philosophical foundations of cryptocurrency and money.

한양대학교 비트코인·화폐철학 전공 대학원생들이 시작한 커뮤니티입니다. 우리는 암호화폐를 투자 대상이 아니라 **신뢰의 구조를 다시 설계하는 기술**, **화폐 형태를 바꾸는 문명사적 사건**으로 다룹니다.

**우리가 던지는 질문** — 화폐란 무엇인가? 신뢰는 어떻게 조직되는가? 국가는 어떤 방식으로 경제 질서를 구성하는가? 비트코인은 이 모든 것의 어떤 변화를 예고하는가?

**다루지 않는 것** — 가격 전망, 시세 예측, 매수·매도 의견, 투자 추천·전략, 차트 분석, 수익률 인증. 본 아카이브는 투자 커뮤니티가 아닙니다. (자세한 기준: 운영 원칙 문서)

## 아카이브 구조

| 카테고리 | 내용 | 작성 권한 |
|---|---|---|
| News | 화폐·제도 분석에 기반한 사건 해석 | 교수·Contributor 이상 |
| Concepts | 핵심 개념·이론 정리 | 교수·대학원생 |
| Debates | 열린 토론 (공론장) | 모든 회원 |
| Reading Notes | 문헌 요약·비평·주석 | Contributor 이상 |
| Class & Seminars | 수업·세미나 기록 | 교수·대학원생 |
| About | 정체성·운영 문서 | 운영진 |

역할(ADMIN/PROFESSOR/GRAD/CONTRIBUTOR/USER)과 90일 기여 점수(`CS = 0.35·AS + 0.40·IS + 0.25·SS`) 기반 Contributor 레벨 제도로 운영됩니다.

## 기술 스택

Next.js(App Router) · NextAuth(Google OAuth) · Prisma · PostgreSQL(Supabase) · Supabase Storage · Resend · Vercel(+Cron) · Tailwind CSS v3 · TipTap 에디터

## 개발 시작 (Quick Start)

```bash
git clone https://github.com/Joopeter-Jin/hyu-archive.git
cd hyu-archive
npm install
# .env 작성 (아래 '환경 변수' 참고)
npx prisma generate
npx prisma migrate deploy   # 최초 1회: DB 테이블 생성
npm run dev                 # http://localhost:3000
```

### 환경 변수 (.env)

| 변수 | 용도 |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Supabase Postgres (pooler 6543 `?pgbouncer=true` / direct 5432) |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | NextAuth (로컬: `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase Storage (`editor-images` 공개 버킷 필요) |
| `NEXT_PUBLIC_SITE_URL` | RSS·메일 링크 기준 주소 |
| `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL` | 이메일 알림 (선택) |
| `CRON_SECRET` | cron 엔드포인트 보호 |

로컬 실행·Vercel/Supabase 배포의 단계별 절차는 프로젝트 문서 **`로컬_실행_및_배포_가이드`**, 코드 구조 전반은 **`Website_technical_description`** 문서를 참고하세요.

## 배포

Vercel 기준. GitHub 연동 Import 후 환경 변수 입력만 하면 됩니다. `vercel.json`에 cron 2개(알림 매일 00:00, 점수 재계산 매일 09:10)가 정의되어 있으며, Vercel Cron이 `Authorization: Bearer $CRON_SECRET` 헤더로 자동 인증합니다.
