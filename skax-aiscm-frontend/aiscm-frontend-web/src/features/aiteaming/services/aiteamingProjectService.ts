import { getAiteamingHttpClientBaseURL } from "@/features/aiteaming/config";
import { aiteamingApiPrefix } from "@/shared/config/apiSurfaces";
import { http } from "@/shared/http/client";
import { assertApiSuccess, unwrapApiResponse } from "@/shared/http/unwrapApiResponse";
import type { ApiResponse } from "@/shared/types/api";
import type { ProjectSummary } from "@/features/aiteaming/types/project";
import type {
  ProjectRoleDetail,
  ProjectRoleSaveRequest,
  ProjectRoleSaveResult,
} from "@/features/aiteaming/types/projectRole";

const projectsBase = `${aiteamingApiPrefix}/projects`;

export type AiteamingProjectSummaryView = "summary" | "default";

export const aiteamingProjectService = {
  /**
   * 프로젝트 요약 — `[projectCode]` = `pjtNo`
   * - `NEXT_PUBLIC_API_BASE_URL` + API 게이트웨이 CORS 로 브라우저 직접 호출.
   */
  async getProjectSummary(
    pjtNo: string,
    view: AiteamingProjectSummaryView = "summary",
  ): Promise<ProjectSummary> {
    const { data } = await http.get<ApiResponse<ProjectSummary>>(
      `${projectsBase}/${encodeURIComponent(pjtNo)}/summary`,
      {
        params: { view },
        baseURL: getAiteamingHttpClientBaseURL(),
      },
    );
    return unwrapApiResponse(data, "프로젝트 요약 조회에 실패했습니다.");
  },

  async getProjectRoleDetail(pjtRoleDmndId: string): Promise<ProjectRoleDetail> {
    const { data } = await http.get<ApiResponse<ProjectRoleDetail>>(`${projectsBase}/roles`, {
      params: { PjtRoleDmndId: pjtRoleDmndId },
      baseURL: getAiteamingHttpClientBaseURL(),
    });
    return unwrapApiResponse(data, "프로젝트 역할 상세 조회에 실패했습니다.");
  },

  async saveProjectRoleCriteria(body: ProjectRoleSaveRequest): Promise<ProjectRoleSaveResult> {
    const { data } = await http.post<ApiResponse<ProjectRoleSaveResult>>(`${projectsBase}/matching/criteria`, body, {
      baseURL: getAiteamingHttpClientBaseURL(),
    });
    return unwrapApiResponse(data, "프로젝트 역할 저장에 실패했습니다.");
  },

  /** 역할 수요 P등급만 변경 — 미배정 탭 등급지정 UI */
  async patchRoleDemandPlvl(pjtNo: string, pjtRoleDmndId: string, plvlTpCd: string): Promise<void> {
    const { data } = await http.patch<ApiResponse<unknown>>(
      `${projectsBase}/${encodeURIComponent(pjtNo)}/role-demands/${encodeURIComponent(pjtRoleDmndId)}/plvl`,
      { plvlTpCd },
      { baseURL: getAiteamingHttpClientBaseURL() },
    );
    assertApiSuccess(data, "역할 수요 P등급 변경에 실패했습니다.");
  },
};
