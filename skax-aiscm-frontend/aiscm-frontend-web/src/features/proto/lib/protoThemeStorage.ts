/**
 * prototype `main.tsx` + `uiSlice` 와 동일 키·동일 규칙 (나머지 앱과 테마 동기화 가능).
 */
export type ProtoThemeMode = "light" | "dark";

const STORAGE_KEY = "ai-teaming-theme";

export function readStoredTheme(): ProtoThemeMode {
  try {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function writeStoredTheme(mode: ProtoThemeMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}
