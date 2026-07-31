"use client";

import { useProtoTheme } from "@/features/proto/components/layout/ProtoThemeContext";

/**
 * prototype `App.tsx` 톱바 테마 버튼과 동일 라벨·title.
 */
export default function ProtoThemeToggle() {
  const { theme, toggleTheme } = useProtoTheme();

  return (
    <button
      type="button"
      className="proto-theme-toggle"
      onClick={toggleTheme}
      title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      {theme === "dark" ? "라이트" : "다크"}
    </button>
  );
}
