"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type ProtoThemeMode,
  readStoredTheme,
  writeStoredTheme,
} from "@/features/proto/lib/protoThemeStorage";

type ProtoThemeContextValue = {
  theme: ProtoThemeMode;
  toggleTheme: () => void;
};

const ProtoThemeContext = createContext<ProtoThemeContextValue | null>(null);

export function useProtoTheme(): ProtoThemeContextValue {
  const ctx = useContext(ProtoThemeContext);
  if (ctx == null) {
    throw new Error("useProtoTheme는 ProtoThemeProvider 하위에서만 사용할 수 있습니다.");
  }
  return ctx;
}

/**
 * `/proto` 루트에 `data-proto-theme` 을 두고, prototype 과 동일한 저장소로 라이트/다크 전환.
 */
export function ProtoThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ProtoThemeMode>("dark");

  useLayoutEffect(() => {
    setTheme(readStoredTheme());
  }, []);

  useLayoutEffect(() => {
    document.body.classList.add("proto-body-lock");
    return () => {
      document.body.classList.remove("proto-body-lock");
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next: ProtoThemeMode = t === "dark" ? "light" : "dark";
      writeStoredTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ProtoThemeContext.Provider value={value}>
      <div
        className="proto-layout-root proto-parity-scope"
        data-proto-theme={theme}
        suppressHydrationWarning
      >
        {children}
      </div>
    </ProtoThemeContext.Provider>
  );
}
