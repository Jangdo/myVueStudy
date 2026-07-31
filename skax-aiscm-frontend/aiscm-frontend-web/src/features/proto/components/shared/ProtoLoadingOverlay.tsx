"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const APP_SHELL_MAIN_ID = "app-shell-main";

type Props = {
  active: boolean;
  label?: string;
};

/** prototype `LoadingOverlay` — `#app-shell-main` 포털 */
export function ProtoLoadingOverlay({ active, label = "불러오는 중…" }: Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!active) return null;

  const node = (
    <div className="loading-overlay" role="status" aria-live="polite" aria-label={label}>
      <div className="loading-overlay__spinner" aria-hidden />
      <p className="loading-overlay__label">{label}</p>
    </div>
  );

  // 하이드레이션 안정성을 위해 마운트 전에는 인라인으로 렌더
  if (!isMounted || typeof document === "undefined") return node;
  const target = document.getElementById(APP_SHELL_MAIN_ID);
  if (!target) return node;

  return createPortal(node, target);
}
