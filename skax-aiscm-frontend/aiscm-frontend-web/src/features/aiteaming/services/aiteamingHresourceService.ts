import { getAiteamingHttpClientBaseURL } from "@/features/aiteaming/config";
import { aiteamingApiPrefix } from "@/shared/config/apiSurfaces";
import { http } from "@/shared/http/client";
import { unwrapApiResponse } from "@/shared/http/unwrapApiResponse";
import type { ApiResponse } from "@/shared/types/api";
import type { HresourceDetailData } from "@/features/aiteaming/types/hresource";

const listPath = `${aiteamingApiPrefix}/hresources/list`;

export const aiteamingHresourceService = {
  async searchByKeyword(keyword: string): Promise<HresourceDetailData> {
    const { data } = await http.get<ApiResponse<HresourceDetailData>>(listPath, {
      params: { keyword: keyword.trim() },
      baseURL: getAiteamingHttpClientBaseURL(),
    });
    return unwrapApiResponse(data, "인력 검색에 실패했습니다.");
  },
};
