import axios from "axios";

/**
 * Axios 단일 인스턴스 (frontend.dev.mdc §3.3 가이드).
 * - baseURL: NEXT_PUBLIC_API_BASE_URL 환경변수, 미지정 시 개발 환경 기본값 사용
 * - 요청 인터셉터: Bearer 토큰 주입 (TODO: tokenStorage 도입 후 실연동)
 * - 응답 인터셉터: 401 처리(TODO)
 */
const DEFAULT_BASE_URL = "https://aiscm-dev.skax.co.kr/api";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;

export const httpClient = axios.create({
  baseURL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  // TODO: tokenStorage에서 JWT를 가져와 Authorization 헤더 주입
  // const token = tokenStorage.get();
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: 401 처리 - 'auth:unauthorized' 이벤트 디스패치 등
    return Promise.reject(error);
  },
);
