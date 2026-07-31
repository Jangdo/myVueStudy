"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ScreenId } from "@/config/screenMap";

/**
 * SAT_101P 긴급공지팝업 — 전역(global) client-mounted 모달.
 *
 * 호출 방식: `?modal=urgent-notice` query 추가로 어디서든 트리거.
 *   - 정적 export 모드에서는 Next.js 인터셉트 라우트를 사용할 수 없어
 *     screenMap의 `queryTrigger` 메타 + 루트 client wrapper 마운트 패턴으로 구현.
 *   - SAT_106P(shared)와 동일한 패턴이지만 부모 라우트 제약이 없는 점이 다름.
 *
 * 직접 URL 진입(딥링크) 시에는 `src/app/ai-teaming/notice/page.tsx`(풀페이지)가 표시됩니다.
 */
export const screenId: ScreenId = "SAT_101P";

export function UrgentNoticeModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isOpen = searchParams.get("modal") === "urgent-notice";

  if (!isOpen) return null;

  const close = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("modal");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="긴급 공지"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "8px",
          minWidth: "320px",
          maxWidth: "600px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>긴급 공지 (SAT_101P)</h2>
        <p>이곳에 긴급 공지 내용을 표시합니다. (TODO: 실제 내용 구현)</p>
        <div style={{ marginTop: "16px", textAlign: "right" }}>
          <button type="button" onClick={close}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
