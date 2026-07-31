import { getAiteamingHttpClientBaseURL } from "@/features/aiteaming/config";
import { aiteamingApiPrefix } from "@/shared/config/apiSurfaces";
import { http } from "@/shared/http/client";
import { unwrapApiResponse } from "@/shared/http/unwrapApiResponse";
import type { AiTeamingUserDetail } from "@/features/aiteaming/types/userDetail";
import type { ApiResponse } from "@/shared/types/api";

const usersBase = `${aiteamingApiPrefix}/users`;

export const aiteamingUserService = {
  async getUserDetail(usrId: string): Promise<AiTeamingUserDetail> {
    const { data } = await http.get<ApiResponse<AiTeamingUserDetail>>(
      `${usersBase}/${encodeURIComponent(usrId)}/detail`,
      {
        baseURL: getAiteamingHttpClientBaseURL(),
      },
    );
    return unwrapApiResponse(data, "사용자 상세 조회에 실패했습니다.");
  },
};
