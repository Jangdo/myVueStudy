import { getAiteamingHttpClientBaseURL } from "@/features/aiteaming/config";
import { aiteamingApiPrefix } from "@/shared/config/apiSurfaces";
import { http } from "@/shared/http/client";
import { unwrapApiResponse } from "@/shared/http/unwrapApiResponse";
import type {
  AssignmentRegisterData,
  AssignmentRegisterRequest,
  AssignmentSelectionsDeleteRequest,
} from "@/features/aiteaming/types/assignments";
import type { ApiResponse } from "@/shared/types/api";

const assignmentsPath = `${aiteamingApiPrefix}/assignments`;

export const aiteamingAssignmentService = {
  async postRegister(mpSelctTpCd: string, body: AssignmentRegisterRequest): Promise<AssignmentRegisterData> {
    const { data } = await http.post<ApiResponse<AssignmentRegisterData>>(assignmentsPath, body, {
      params: { mpSelctTpCd },
      baseURL: getAiteamingHttpClientBaseURL(),
    });
    return unwrapApiResponse(data, "인력 배정 등록에 실패했습니다.");
  },

  /** 수요인력선정상세 일괄 물리 삭제 — 배정취소 */
  async postSelectionsDelete(body: AssignmentSelectionsDeleteRequest): Promise<number> {
    const { data } = await http.post<ApiResponse<number>>(`${assignmentsPath}/selections/delete`, body, {
      baseURL: getAiteamingHttpClientBaseURL(),
    });
    return unwrapApiResponse(data, "배정 취소(선정 삭제)에 실패했습니다.");
  },
};
