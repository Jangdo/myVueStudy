import { getAiteamingHttpClientBaseURL } from "@/features/aiteaming/config";
import { aiteamingApiPrefix } from "@/shared/config/apiSurfaces";
import { http } from "@/shared/http/client";
import { unwrapApiResponse } from "@/shared/http/unwrapApiResponse";
import type { CommonCodeItem, CommonJobSklstBundle, CommonRole } from "@/features/aiteaming/types/common";
import type { ApiResponse } from "@/shared/types/api";

const commonBasePath = `${aiteamingApiPrefix}/common`;

export const aiteamingCommonService = {
  /** BC007 공통코드 그룹별 상세 조회 */
  async postGrpCodes(cmmGrpCd: string[]): Promise<CommonCodeItem[]> {
    const { data } = await http.post<ApiResponse<CommonCodeItem[]>>(`${commonBasePath}/grpcodes`, { cmmGrpCd }, {
      baseURL: getAiteamingHttpClientBaseURL(),
    });
    return unwrapApiResponse(data, "공통코드 조회에 실패했습니다.");
  },

  async getRoles(): Promise<CommonRole[]> {
    const { data } = await http.get<ApiResponse<CommonRole[]>>(`${commonBasePath}/roles`, {
      baseURL: getAiteamingHttpClientBaseURL(),
    });
    return unwrapApiResponse(data, "역할 목록 조회에 실패했습니다.");
  },

  async getJobSklsts(): Promise<CommonJobSklstBundle[]> {
    const { data } = await http.get<ApiResponse<CommonJobSklstBundle[]>>(`${commonBasePath}/sklsts`, {
      baseURL: getAiteamingHttpClientBaseURL(),
    });
    return unwrapApiResponse(data, "직무/스킬셋 목록 조회에 실패했습니다.");
  },
};
