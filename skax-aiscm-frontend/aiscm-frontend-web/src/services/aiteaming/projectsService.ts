import { httpClient } from "@/services/http/client";
import type { ProjectDetailResponse } from "@/types/aiteaming/project";

/**
 * SCM_API_BC018 — 프로젝트 상세 조회
 *
 * 엔드포인트: GET /v1/aiteaming/BC018?viewid=&pjtNo={projectId}
 *
 * NOTE: 정의서(BC018)는 viewid 파라미터만 명시되어 있어 프로젝트 식별자 전달 방식이 보완 필요.
 *       임시로 pjtNo를 query에 추가하여 호출. 명세 확정 시 정정 예정.
 *       (api_test.http 124~128 라인 참고)
 */
export async function fetchProjectDetail(
  projectId: string,
): Promise<ProjectDetailResponse> {
  const { data } = await httpClient.get<ProjectDetailResponse>(
    "/v1/aiteaming/BC018",
    {
      params: {
        viewid: "SAT_103M",
        pjtNo: projectId,
      },
    },
  );
  return data;
}
