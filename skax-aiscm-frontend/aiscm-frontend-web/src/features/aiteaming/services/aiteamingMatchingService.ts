import { getAiteamingHttpClientBaseURL } from "@/features/aiteaming/config";
import { aiteamingApiPrefix } from "@/shared/config/apiSurfaces";
import { http } from "@/shared/http/client";
import { unwrapApiResponse } from "@/shared/http/unwrapApiResponse";
import type { ApiResponse } from "@/shared/types/api";
import type {
  MatchingExcludedOrgRes,
  MatchingWeightRes,
  RecommendMembersBlock,
  RecommendMembersRequest,
} from "@/features/aiteaming/types/matchingMembers";

const matchingMembersPath = (pjtNo: string) =>
  `${aiteamingApiPrefix}/projects/${encodeURIComponent(pjtNo)}/matching/members`;

const matchingWeightsPath = `${aiteamingApiPrefix}/matching/weights`;

const matchingExcludedOrgsPath = `${aiteamingApiPrefix}/matching/excluded-orgs`;

export const aiteamingMatchingService = {
  async getSavedWeights(pjtRoleDmndId: string): Promise<MatchingWeightRes[]> {
    const id = pjtRoleDmndId.trim();
    if (!id) {
      throw new Error("pjtRoleDmndId가 필요합니다.");
    }
    const { data } = await http.get<ApiResponse<MatchingWeightRes[]>>(matchingWeightsPath, {
      params: { pjtRoleDmndId: id },
      baseURL: getAiteamingHttpClientBaseURL(),
    });
    return unwrapApiResponse(data, "저장된 매칭 가중치를 불러오지 못했습니다.");
  },

  async getExcludedOrgs(pjtRoleDmndId: string): Promise<MatchingExcludedOrgRes[]> {
    const id = pjtRoleDmndId.trim();
    if (!id) {
      throw new Error("pjtRoleDmndId가 필요합니다.");
    }
    const { data } = await http.get<ApiResponse<MatchingExcludedOrgRes[]>>(matchingExcludedOrgsPath, {
      params: { pjtRoleDmndId: id },
      baseURL: getAiteamingHttpClientBaseURL(),
    });
    return unwrapApiResponse(data, "저장된 제외 조직을 불러오지 못했습니다.");
  },

  async postRecommendMembers(pjtNo: string, body: RecommendMembersRequest): Promise<RecommendMembersBlock[]> {
    const { data } = await http.post<ApiResponse<RecommendMembersBlock[]>>(matchingMembersPath(pjtNo), body, {
      params: { gubun: "member" },
      baseURL: getAiteamingHttpClientBaseURL(),
    });
    return unwrapApiResponse(data, "AI 추천 인력 조회에 실패했습니다.");
  },
};
