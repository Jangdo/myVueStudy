"use client";

import type { PropsWithChildren, ReactNode } from "react";
import "@/features/proto/styles/team-mgmt/team-mgmt-modal-parity.css";

type Props = PropsWithChildren<{
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm?: () => void;
  singleAction?: boolean;
  wide?: boolean;
  actionsPrefix?: ReactNode;
  singleActionExtra?: ReactNode;
}>;

/** prototype `Modal` — 팀 배정 관리 전용 */
export function ProtoTeamMgmtModal({
  open,
  title,
  onCancel,
  onConfirm,
  children,
  singleAction,
  wide,
  actionsPrefix,
  singleActionExtra,
}: Props) {
  if (!open) return null;
  const confirm = onConfirm ?? onCancel;
  return (
    <div className="tm-modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className={"tm-modal-box" + (wide ? " tm-modal-box--wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tm-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="tm-modal-title" className="tm-modal-title">
          {title}
        </h2>
        <div className="tm-modal-body">{children}</div>
        <div className="tm-modal-actions">
          {actionsPrefix ? <div className="tm-modal-actions__prefix">{actionsPrefix}</div> : null}
          {singleAction ? (
            <div className="tm-modal-actions__buttons">
              {singleActionExtra}
              <button type="button" className="btn btn-primary" onClick={onCancel}>
                닫기
              </button>
            </div>
          ) : (
            <div className="tm-modal-actions__buttons">
              <button type="button" className="btn" onClick={onCancel}>
                취소
              </button>
              <button type="button" className="btn btn-primary" onClick={confirm}>
                확인
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
