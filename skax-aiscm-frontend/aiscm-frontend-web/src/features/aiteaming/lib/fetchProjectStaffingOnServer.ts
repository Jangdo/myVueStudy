import { aiteamingApiPrefix } from "@/shared/config/apiSurfaces";
import {
  AITEAMING_SERVER_FETCH_TIMEOUT_MS,
  getAiteamingServerFetchBase,
} from "@/features/aiteaming/lib/aiteamingServerEnv";
import type { ApiResponse } from "@/shared/types/api";
import type { ProjectMember, ProjectStaffingPayload } from "@/features/aiteaming/types/projectStaffing";

/**
 * AI Teaming 투입인력 API 전체 URL (Next 서버 fetch 전용).
 * @example `http://localhost:8081/api/v1/aiteaming/projects/30133584-D001/members/assign`
 */
export function buildProjectMembersAssignAbsoluteUrl(pjtNo: string, gubun?: string): string {
  const q = new URLSearchParams();
  if (gubun != null && gubun !== "") q.set("gubun", gubun);
  const qs = q.toString();
  return `${getAiteamingServerFetchBase()}${aiteamingApiPrefix}/projects/${encodeURIComponent(pjtNo)}/members/assign${qs ? `?${qs}` : ""}`;
}

/**
 * Next 서버에서만 호출 — GET `{base}/api/v1/aiteaming/projects/{pjtNo}/members/assign[?gubun=]`
 */
export async function fetchProjectStaffingOnServer(
  pjtNo: string,
  gubun?: string,
): Promise<{
  members: ProjectMember[] | null;
  error: string | null;
}> {
  const url = buildProjectMembersAssignAbsoluteUrl(pjtNo, gubun);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(AITEAMING_SERVER_FETCH_TIMEOUT_MS),
    });
    let json: ApiResponse<ProjectStaffingPayload>;
    try {
      json = (await res.json()) as ApiResponse<ProjectStaffingPayload>;
    } catch {
      return {
        members: null,
        error: `투입인력 API 응답이 JSON이 아닙니다 (HTTP ${res.status}).`,
      };
    }
    if (!res.ok) {
      return {
        members: null,
        error: json?.error?.message ?? `투입인력 조회 실패 (HTTP ${res.status})`,
      };
    }
    if (!json.success || json.data == null) {
      return {
        members: null,
        error: json.error?.message ?? "프로젝트 투입인력 조회에 실패했습니다.",
      };
    }
    return { members: json.data.members ?? [], error: null };
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      return {
        members: null,
        error: `투입인력 API 응답 시간 초과(${AITEAMING_SERVER_FETCH_TIMEOUT_MS / 1000}s). API 기동·AITEAMING_SERVER_FETCH_URL·NEXT_PUBLIC_AITEAMING_API_TIER 를 확인하세요.`,
      };
    }
    const message = e instanceof Error ? e.message : "네트워크 오류";
    return { members: null, error: message };
  }
}
