import { getAiteamingHttpClientBaseURL } from "@/features/aiteaming/config";
import { aiteamingApiPrefix } from "@/shared/config/apiSurfaces";
import { http } from "@/shared/http/client";
import { unwrapApiResponse } from "@/shared/http/unwrapApiResponse";
import type { ApiResponse } from "@/shared/types/api";
import type { AiteamingOrgTreeNode } from "@/features/aiteaming/types/orgs";

const orgsPath = `${aiteamingApiPrefix}/orgs`;

export const aiteamingOrgsService = {
  async getOrgTree(): Promise<AiteamingOrgTreeNode[]> {
    const { data } = await http.get<ApiResponse<AiteamingOrgTreeNode[]>>(orgsPath, {
      baseURL: getAiteamingHttpClientBaseURL(),
    });
    return unwrapApiResponse(data, "조직 정보를 불러오지 못했습니다.");
  },
};
