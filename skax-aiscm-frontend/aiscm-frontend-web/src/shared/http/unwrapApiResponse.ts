import type { ApiResponse } from "@/shared/types/api";

/**
 * Axios 응답 본문(`data`)이 백엔드 `ApiResponse`일 때 도메인 페이로드만 반환합니다.
 * `success: false` 또는 `data` 누락 시 `Error`를 던집니다.
 * (`DELETE` 등 본문이 `null`인 성공 응답은 `assertApiSuccess` 사용)
 */
export function unwrapApiResponse<T>(
  response: ApiResponse<T> | undefined,
  fallbackMessage = "요청이 실패했습니다.",
): T {
  if (response == null) {
    throw new Error(fallbackMessage);
  }
  if (!response.success) {
    throw new Error(response.error?.message ?? fallbackMessage);
  }
  if (response.data === undefined || response.data === null) {
    throw new Error(fallbackMessage);
  }
  return response.data;
}

/** 본문 데이터 없이 성공 여부만 검증할 때 (예: `ApiResponse.ok(null)` 삭제·로그아웃) */
export function assertApiSuccess(
  response: ApiResponse<unknown> | undefined,
  fallbackMessage = "요청이 실패했습니다.",
): void {
  if (response == null) {
    throw new Error(fallbackMessage);
  }
  if (!response.success) {
    throw new Error(response.error?.message ?? fallbackMessage);
  }
}
