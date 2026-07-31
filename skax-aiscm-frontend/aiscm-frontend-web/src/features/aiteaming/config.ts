/**
 * AI Teaming 도메인 설정 (브라우저·Next 서버 양면).
 *
 * 통합 출처:
 * - 구 `src/config/aiteaming.ts` (도메인 상수)
 * - 구 `src/config/aiteamingApiBase.ts` (베이스 URL 결정 로직)
 *
 * 베이스 URL 정책 — business 직결 vs API 게이트웨이:
 * - `NEXT_PUBLIC_AITEAMING_API_TIER=local` (기본): `http://127.0.0.1:8083`
 * - `dev` / `prod`: `http://127.0.0.1:8081` (게이트웨이 등)
 *
 * 브라우저 호출 베이스는 다른 API와 동일하게 `NEXT_PUBLIC_API_BASE_URL`.
 * Next 서버 fetch 전용 URL은 `AITEAMING_SERVER_FETCH_URL` 이 tier·기본 포트보다 우선한다.
 */

/**
 * AI Teaming — 백엔드 `pjt_no` / API `projectCode` 와 동일.
 * (요약 API 연동 시 당분간 고정 조회 body에 사용, URL `projectCode`와 별도)
 */
export const AITEAMING_PROJECT_SUMMARY_CODE_FIXED = "PJT-2026-0001";

export type AiteamingApiTier = "local" | "dev" | "prod";

export function getAiteamingApiTier(): AiteamingApiTier {
  const raw = (process.env.NEXT_PUBLIC_AITEAMING_API_TIER ?? "local").toLowerCase().trim();
  if (raw === "dev" || raw === "development" || raw === "staging") return "dev";
  if (raw === "prod" || raw === "production") return "prod";
  return "local";
}

/** tier 에 따른 기본 호스트 (명시 URL 이 없을 때만 사용) */
export function getAiteamingDefaultHttpBase(): string {
  const port = getAiteamingApiTier() === "local" ? "8083" : "8081";
  return `http://127.0.0.1:${port}`;
}

/**
 * 브라우저(axios, `aiteamingBrowserFetch`) — **API 게이트웨이(또는 CORS 허용 백엔드)로 직접** 호출.
 * `NEXT_PUBLIC_API_BASE_URL` 과 동일 베이스를 쓴다. 미설정 시 `http://127.0.0.1:8081`.
 */
export function getAiteamingBrowserApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (raw != null && String(raw).trim() !== "") {
    return String(raw).trim().replace(/\/$/, "");
  }
  return "http://127.0.0.1:8081";
}

/** axios `baseURL` — 브라우저에서 게이트웨이/백엔드 절대 URL과 동일 */
export function getAiteamingHttpClientBaseURL(): string {
  return getAiteamingBrowserApiBase();
}

/** Next 서버 fetch — `AITEAMING_SERVER_FETCH_URL` 우선 */
export function getAiteamingServerFetchBaseResolved(): string {
  const explicit = process.env.AITEAMING_SERVER_FETCH_URL;
  if (explicit != null && String(explicit).trim() !== "") {
    return String(explicit).replace(/\/$/, "");
  }
  return getAiteamingDefaultHttpBase();
}
