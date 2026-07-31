"use client";

import type { ScreenId } from "@/config/screenMap";

/**
 * SAT_106P 배정요청 결재자 확인 / 배정취소 승인요청 팝업 (공용 모달).
 *
 * 호출 방식: scope='shared' — 부모 라우트에 `?modal=approver-confirm` query 추가로 트리거.
 * 부모는 `/ai-teaming/projects/[projectId]`와 `/ai-teaming/approvals` 두 곳.
 *
 * 부모 페이지에서 다음과 같이 사용:
 *
 *   const searchParams = useSearchParams();
 *   const isOpen = searchParams.get("modal") === "approver-confirm";
 *   const targetId = searchParams.get("targetId") ?? undefined;
 *   // 닫기: query 제거 후 router.replace(pathname + remainingQuery)
 *   {isOpen && <ApproverConfirmModal targetId={targetId} onClose={close} />}
 *
 * NOTE: 본 컴포넌트는 골격(placeholder)이며 실제 UI/로직은 추후 디자인 적용 시 구현.
 */
export const screenId: ScreenId = "SAT_106P";

export interface ApproverConfirmModalProps {
  /** 결재 대상 식별자 (예: 배정 요청 ID 또는 배정 취소 요청 ID) */
  targetId?: string;
  /** 모달 닫기 콜백 — 부모가 query 제거 + router.replace 책임 */
  onClose: () => void;
}

export function ApproverConfirmModal({
  targetId,
  onClose,
}: ApproverConfirmModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="결재자 확인"
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
          minWidth: "360px",
          maxWidth: "640px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>결재자 확인 (SAT_106P)</h2>
        <p>
          {/* 두 컨텍스트(배정요청/배정취소)에서 동일 UI로 사용 */}
          대상 ID: <code>{targetId ?? "(미지정)"}</code>
        </p>
        <p>이곳에 결재자 확인 UI를 구현합니다. (TODO: 실제 내용 구현)</p>
        <div style={{ marginTop: "16px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose}>
            취소
          </button>
          <button type="button" onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
