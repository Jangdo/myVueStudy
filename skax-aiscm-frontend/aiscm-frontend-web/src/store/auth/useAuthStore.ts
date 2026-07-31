"use client";

import { create } from "zustand";
import type { ScreenId } from "@/config/screenMap";

/**
 * 인증/권한 관련 클라이언트 상태.
 * - 서버 응답으로 받은 사용자 정보와 접근 가능한 화면ID 목록(권한 캐시)을 보관
 * - 컴포넌트는 selector로 필요한 슬라이스만 구독해야 불필요 리렌더를 줄일 수 있음
 *
 * NOTE: 영속화(localStorage)는 이번 단계에선 적용하지 않습니다.
 *       필요해지면 `zustand/middleware`의 `persist`를 추가하면 됩니다.
 */
export interface AuthState {
  userId: string | null;
  /** 사용자가 접근 가능한 화면ID 목록 (권한 캐시) */
  allowedScreenIds: ScreenId[];
  setUser: (userId: string, screens: ScreenId[]) => void;
  clear: () => void;
  /** 특정 화면ID에 대한 접근 가능 여부 확인 */
  canAccess: (screenId: ScreenId) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  allowedScreenIds: [],
  setUser: (userId, screens) =>
    set({ userId, allowedScreenIds: screens }),
  clear: () => set({ userId: null, allowedScreenIds: [] }),
  canAccess: (screenId) => get().allowedScreenIds.includes(screenId),
}));
