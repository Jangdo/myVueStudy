import { http } from "@/shared/http/client";
import { unwrapApiResponse } from "@/shared/http/unwrapApiResponse";
import { protoConfig } from "@/features/proto/config";
import type { ApiResponse } from "@/shared/types/api";

export interface ProtoHealthData {
  status: string;
  scope: string;
  timestamp: string;
}

export const protoHealthService = {
  async check(): Promise<ProtoHealthData> {
    const { data } = await http.get<ApiResponse<Partial<ProtoHealthData>>>(
      `${protoConfig.apiPrefix}/health`,
    );
    const payload = unwrapApiResponse(data, "proto 헬스 확인에 실패했습니다.");
    return {
      status: payload.status ?? "UNKNOWN",
      scope: payload.scope ?? "UNKNOWN",
      timestamp: payload.timestamp ?? "-",
    };
  },
};
