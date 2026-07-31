/**
 * AI Teaming 프로젝트 관련 응답 타입 (BC018).
 *
 * NOTE: 실제 응답 구조는 정의서 보완 후 정정 예정.
 *       현재는 안전한 wrapper 형태(data + success flag)만 선언하고,
 *       페이로드는 unknown으로 두어 호출 측에서 점진적으로 좁히도록 함.
 */

/** 공통 응답 wrapper (ApiResponse 패턴) */
export interface ApiResponse<T> {
  success?: boolean;
  code?: string;
  message?: string;
  data: T;
}

/** BC018 프로젝트 상세 — 페이로드(미확정) */
export type ProjectDetailPayload = Record<string, unknown>;

/** BC018 프로젝트 상세 응답 */
export type ProjectDetailResponse = ApiResponse<ProjectDetailPayload>;
