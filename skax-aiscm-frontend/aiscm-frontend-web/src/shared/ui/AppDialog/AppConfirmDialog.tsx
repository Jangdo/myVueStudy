"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./AppDialog.module.css";

export interface AppConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  cancelLabel?: string;
  confirmLabel?: string;
  /** 삭제 등 위험 동작 시 확인 버튼 강조 */
  confirmVariant?: "primary" | "danger";
  onCancel: () => void;
  onConfirm: () => void;
}

function IconClose() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** 시스템 `confirm` 대체 — 취소 / 확인 */
export function AppConfirmDialog({
  open,
  title = "확인",
  message,
  cancelLabel = "취소",
  confirmLabel = "확인",
  confirmVariant = "primary",
  onCancel,
  onConfirm,
}: AppConfirmDialogProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!mounted || !open) return null;

  const confirmClass =
    confirmVariant === "danger" ? `${styles.btnConfirm} ${styles.btnConfirmDanger}` : styles.btnConfirm;

  return createPortal(
    <div className={styles.backdrop} role="presentation" onClick={onCancel}>
      <div
        className={styles.panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.closeBtn} onClick={onCancel} aria-label="닫기">
          <IconClose />
        </button>
        <div className={styles.body}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <p className={styles.message}>{message}</p>
        </div>
        <div className={styles.footer}>
          <div className={styles.actions}>
            <button type="button" className={styles.btnCancel} onClick={onCancel}>
              {cancelLabel}
            </button>
            <button type="button" className={confirmClass} onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
