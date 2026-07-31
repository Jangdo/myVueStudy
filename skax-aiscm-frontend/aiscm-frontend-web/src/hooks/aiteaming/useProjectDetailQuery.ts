"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProjectDetail } from "@/services/aiteaming/projectsService";

/**
 * SAT_103M 프로젝트 상세 데이터 훅 (BC018 호출 래퍼).
 *
 * queryKey 컨벤션: [<도메인>, <API ID>, <리소스>, ...식별자]
 *
 * @param projectId — 동적 세그먼트 `[projectId]`. 빈 값이면 자동 호출 안 함.
 */
export function useProjectDetailQuery(projectId: string) {
  return useQuery({
    queryKey: ["ai-teaming", "BC018", "projects", projectId],
    queryFn: () => fetchProjectDetail(projectId),
    enabled: Boolean(projectId),
  });
}
