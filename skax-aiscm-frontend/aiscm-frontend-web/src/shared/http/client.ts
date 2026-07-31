import axios, { AxiosError } from "axios";
import { tokenStorage } from "@/shared/auth/tokenStorage";
import type { ApiResponse } from "@/shared/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081";

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status;
    if (status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    const body = error.response?.data;
    const fromApiBody =
      body?.error?.message != null && String(body.error.message).length > 0
        ? String(body.error.message)
        : undefined;

    const statusFallback =
      status === 401
        ? "인증이 필요합니다. 로그인 후 다시 시도해 주세요."
        : status === 403
          ? "접근 권한이 없습니다."
          : status === 500 || status === 502 || status === 503
            ? "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
            : undefined;

    const message =
      fromApiBody ??
      statusFallback ??
      error.message ??
      "요청 처리 중 오류가 발생했습니다.";

    return Promise.reject(new Error(message));
  },
);
