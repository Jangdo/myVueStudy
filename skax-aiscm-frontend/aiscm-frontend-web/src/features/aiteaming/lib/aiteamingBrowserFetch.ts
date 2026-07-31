/**
 * 브라우저에서 AI Teaming API 호출 — `getAiteamingBrowserApiBase()` 절대 URL로 직접 fetch (게이트웨이 CORS 필요).
 */
import { aiteamingApiPrefix } from "@/shared/config/apiSurfaces";
import { getAiteamingBrowserApiBase } from "@/features/aiteaming/config";
import type { ApiResponse } from "@/shared/types/api";
import type { ProjectSummary } from "@/features/aiteaming/types/project";
import type { ProjectMember, ProjectStaffingPayload } from "@/features/aiteaming/types/projectStaffing";

const TIMEOUT_MS = 15_000;

export type ProjectSummaryView = "summary" | "default";

export async function fetchProjectSummaryInBrowser(
  pjtNo: string,
  view: ProjectSummaryView = "summary",
): Promise<{ summary: ProjectSummary | null; error: string | null }> {
  const base = getAiteamingBrowserApiBase();
  const q = new URLSearchParams({ view });
  const url = `${base}${aiteamingApiPrefix}/projects/${encodeURIComponent(pjtNo)}/summary?${q}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    let json: ApiResponse<ProjectSummary>;
    try {
      json = (await res.json()) as ApiResponse<ProjectSummary>;
    } catch {
      return { summary: null, error: `요약 응답이 JSON이 아닙니다 (HTTP ${res.status}).` };
    }
    if (!res.ok) {
      return { summary: null, error: json?.error?.message ?? `요약 실패 (HTTP ${res.status})` };
    }
    if (!json.success || json.data == null) {
      return { summary: null, error: json.error?.message ?? "프로젝트 요약 조회 실패" };
    }
    return { summary: json.data, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "네트워크 오류";
    return { summary: null, error: message };
  }
}

export async function fetchProjectStaffingInBrowser(
  pjtNo: string,
  gubun?: string,
): Promise<{ members: ProjectMember[] | null; error: string | null }> {
  const base = getAiteamingBrowserApiBase();
  const q = new URLSearchParams();
  if (gubun != null && gubun !== "") q.set("gubun", gubun);
  const qs = q.toString();
  const url = `${base}${aiteamingApiPrefix}/projects/${encodeURIComponent(pjtNo)}/members/assign${qs ? `?${qs}` : ""}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    let json: ApiResponse<ProjectStaffingPayload>;
    try {
      json = (await res.json()) as ApiResponse<ProjectStaffingPayload>;
    } catch {
      return { members: null, error: `투입인력 응답이 JSON이 아닙니다 (HTTP ${res.status}).` };
    }
    if (!res.ok) {
      return { members: null, error: json?.error?.message ?? `투입인력 실패 (HTTP ${res.status})` };
    }
    if (!json.success || json.data == null) {
      return { members: null, error: json.error?.message ?? "투입인력 조회 실패" };
    }
    return { members: json.data.members ?? [], error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "네트워크 오류";
    return { members: null, error: message };
  }
}
