import { sampleApiPrefix } from "@/shared/config/apiSurfaces";
import { http } from "@/shared/http/client";
import { assertApiSuccess, unwrapApiResponse } from "@/shared/http/unwrapApiResponse";
import type { ApiResponse } from "@/shared/types/api";
import type {
  CommonUserSummary,
  SampleItem,
  SampleItemRequest,
} from "@/features/sample/types";

const basePath = sampleApiPrefix;

export const sampleService = {
  async findAll(): Promise<SampleItem[]> {
    const { data } = await http.get<ApiResponse<SampleItem[]>>(basePath);
    return unwrapApiResponse(data, "샘플 목록 조회에 실패했습니다.");
  },

  async create(request: SampleItemRequest): Promise<SampleItem> {
    const { data } = await http.post<ApiResponse<SampleItem>>(basePath, request);
    return unwrapApiResponse(data, "샘플 생성에 실패했습니다.");
  },

  async update(id: number, request: SampleItemRequest): Promise<SampleItem> {
    const { data } = await http.put<ApiResponse<SampleItem>>(
      `${basePath}/${id}`,
      request,
    );
    return unwrapApiResponse(data, "샘플 수정에 실패했습니다.");
  },

  async remove(id: number): Promise<void> {
    const { data } = await http.delete<ApiResponse<null>>(`${basePath}/${id}`);
    assertApiSuccess(data, "샘플 삭제에 실패했습니다.");
  },

  /** business → common Feign user-only 조회 (사번 user_id 기준) */
  async findUserByUserId(userId: string): Promise<CommonUserSummary> {
    const { data } = await http.get<ApiResponse<CommonUserSummary>>(
      `${basePath}/feign/users/${userId}`,
    );
    return unwrapApiResponse(data, "사용자 조회에 실패했습니다.");
  },
};
