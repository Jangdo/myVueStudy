/** 백엔드 `ExceptionDto`와 동일(code + message) */
export interface ApiError {
  code: number;
  message: string;
}

/**
 * 백엔드 `com.skax.scm.*.dto.ApiResponse` JSON 형태.
 * 실패 시 `success: false`이며 `error`가 채워지고 `data`는 생략될 수 있음.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T | null;
  error?: ApiError;
}
