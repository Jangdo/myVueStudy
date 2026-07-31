"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./TeamMemberRoleEditNoticeModal.module.css";

export interface TeamMemberRoleEditNoticeModalProps {
  open: boolean;
  onClose: () => void;
  /** 「정보 수정」 확정 시 (실제 수정 화면으로 이어갈 훅) */
  onConfirm?: () => void;
}

function IconClose() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function TeamMemberRoleEditNoticeModal({ open, onClose, onConfirm }: TeamMemberRoleEditNoticeModalProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const node = (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="닫기">
          <IconClose />
        </button>

        <div className={styles.body}>
          <div id={titleId} className={styles.message}>
            <p>역할 정보를 수정할 경우<br />매칭된 인력은 초기화됩니다.</p>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.actions}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              취소
            </button>
            <button
              type="button"
              className={styles.btnConfirm}
              onClick={() => {
                onConfirm?.();
                onClose();
              }}
            >
              정보 수정
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
