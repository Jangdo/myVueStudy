"use client";

import type { ReactNode } from "react";
import "@/features/proto/styles/team-matching/proto-teaming-modal.css";

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

/** prototype `Modal` 최소 대체 — DOM은 `teaming-proto` 하위에 두어 토큰 상속 */
export function ProtoTeamingModal({ open, title, children, onClose }: Props) {
  if (!open) return null;
  return (
    <div
      className="proto-teaming-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="proto-teaming-modal"
        role="dialog"
        aria-modal
        aria-labelledby="proto-teaming-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="proto-teaming-modal__head">
          <span id="proto-teaming-modal-title">{title}</span>
          <button type="button" className="proto-teaming-modal__close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <div className="proto-teaming-modal__body">{children}</div>
      </div>
    </div>
  );
}
