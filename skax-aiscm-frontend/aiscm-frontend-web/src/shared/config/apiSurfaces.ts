/**
 * 공개 HTTP API 경로 — 1계층(`API_ROOT`)은 백엔드 `app.http.api-root` 와 동일.
 * 2계층(`SURFACE_*`)은 yml이 아닌 본 파일·백엔드 컨트롤러 RequestMapping·GW 라우트와 동기.
 */
export const API_ROOT = "/api/v1";

/** path 상의 서피스 세그먼트(복수면 슬래시 포함) — Java·게이트웨이와 동일 문자열 유지 */
export const SURFACE_PROTO = "proto";
export const SURFACE_SAMPLE = "business/sample";
export const SURFACE_AITEAMING = "aiteaming";

export const protoApiPrefix = `${API_ROOT}/${SURFACE_PROTO}`;
export const sampleApiPrefix = `${API_ROOT}/${SURFACE_SAMPLE}`;
export const aiteamingApiPrefix = `${API_ROOT}/${SURFACE_AITEAMING}`;
