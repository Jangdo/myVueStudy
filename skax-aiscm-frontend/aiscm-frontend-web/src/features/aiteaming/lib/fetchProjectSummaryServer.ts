import { aiteamingApiPrefix } from "@/shared/config/apiSurfaces";
import {
  AITEAMING_SERVER_FETCH_TIMEOUT_MS,
  getAiteamingServerFetchBase,
} from "@/features/aiteaming/lib/aiteamingServerEnv";
import type { ApiResponse } from "@/shared/types/api";
import type { ProjectSummary } from "@/features/aiteaming/types/project";

export type ProjectSummaryView = "summary" | "default";

/**
 * AI Teaming 프로젝트 요약 API 전체 URL (Next 서버 fetch 전용).
 * `view` 생략 시 백엔드와 동일하게 `summary` 를 쿼리에 넣는다.
 *
 * @example `http://localhost:8081/api/v1/aiteaming/projects/30133584-D001/summary?view=summary`
 */
export function buildProjectSummaryAbsoluteUrl(
  pjtNo: string,
  view: ProjectSummaryView | "" = "summary",
): string {
  const effective: ProjectSummaryView = view === "" ? "summary" : view;
  const q = new URLSearchParams({ view: effective });
  return `${getAiteamingServerFetchBase()}${aiteamingApiPrefix}/projects/${encodeURIComponent(pjtNo)}/summary?${q}`;
}

/**
 * Next 서버(빌드 타임·요청 타임)에서만 사용 — 브라우저가 API 호스트에 직접 붙지 않음.
 * @see GET `{base}/api/v1/aiteaming/projects/{pjtNo}/summary?view=summary|default`
 */
export async function fetchProjectSummaryOnServer(
  pjtNo: string,
  view: ProjectSummaryView = "summary",
): Promise<{
  summary: ProjectSummary | null;
  error: string | null;
}> {
  const url = buildProjectSummaryAbsoluteUrl(pjtNo, view);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(AITEAMING_SERVER_FETCH_TIMEOUT_MS),
    });
    let json: ApiResponse<ProjectSummary>;
    try {
      json = (await res.json()) as ApiResponse<ProjectSummary>;
    } catch {
      return {
        summary: null,
        error: `요약 API 응답이 JSON이 아닙니다 (HTTP ${res.status}). URL·포트를 확인하세요.`,
      };
    }
    if (!res.ok) {
      return {
        summary: null,
        error: json?.error?.message ?? `요약 조회 실패 (HTTP ${res.status})`,
      };
    }
    if (!json.success || json.data == null) {
      return {
        summary: null,
        error: json.error?.message ?? "프로젝트 요약 조회에 실패했습니다.",
      };
    }
    return { summary: json.data, error: null };
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      return {
        summary: null,
        error: `요약 API 응답 시간 초과(${AITEAMING_SERVER_FETCH_TIMEOUT_MS / 1000}s). API 기동·AITEAMING_SERVER_FETCH_URL·NEXT_PUBLIC_AITEAMING_API_TIER 를 확인하세요.`,
      };
    }
    const message = e instanceof Error ? e.message : "네트워크 오류";
    return {
      summary: null,
      error: `${message} (서버 fetch: 브라우저 개발자도구 Network에는 요청이 보이지 않습니다)`,
    };
  }
}
