import { http } from "@/shared/http/client";
import { assertApiSuccess, unwrapApiResponse } from "@/shared/http/unwrapApiResponse";
import type { ApiResponse } from "@/shared/types/api";

interface SignUpRequest {
  email: string;
  password: string;
  username: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface TokenData {
  accessToken: string;
}

export const authService = {
  async signUp(request: SignUpRequest): Promise<void> {
    const { data } = await http.post<ApiResponse<unknown>>("/api/v1/common/users/signup", request);
    assertApiSuccess(data, "회원가입에 실패했습니다.");
  },

  async login(request: LoginRequest): Promise<string> {
    const { data } = await http.post<ApiResponse<TokenData>>(
      "/api/v1/common/users/authenticate",
      request,
    );
    return unwrapApiResponse(data, "로그인에 실패했습니다.").accessToken;
  },

  /** Redis `user:auth:{empId}` 삭제 — Authorization Bearer 필요 */
  async logout(): Promise<void> {
    const { data } = await http.post<ApiResponse<unknown>>("/api/v1/common/users/logout", {});
    assertApiSuccess(data, "로그아웃에 실패했습니다.");
  },
};
