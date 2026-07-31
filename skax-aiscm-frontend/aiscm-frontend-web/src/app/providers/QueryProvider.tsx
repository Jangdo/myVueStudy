"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * TanStack Query 전역 Provider.
 * - 클라이언트 사이드에서 한 번만 QueryClient를 생성하기 위해 useState로 lazy 초기화
 * - 기본 옵션은 staleTime 60초, 포커스 시 재요청 끔, 실패 시 1회만 재시도
 *
 * 운영용 devtools는 추후 NODE_ENV가 'development'일 때만 동적 import로 노출 예정.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
