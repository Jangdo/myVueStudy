"use client";

import styles from "./AiTeamingDocTabBar.module.css";

export interface AiTeamingDocTabBarProps {
  tabTitle: string;
  isActive?: boolean;
  onSelect?: () => void;
  onClose?: () => void;
  /** false면 닫기 숨김(유일 탭). */
  closable?: boolean;
}

export function AiTeamingDocTabBar({
  tabTitle,
  isActive = false,
  onSelect,
  onClose,
  closable = true,
}: AiTeamingDocTabBarProps) {
  return (
    <div
      className={`${styles.tab} ${isActive ? styles.tabActive : styles.tabInactive}`}
      role="tab"
      tabIndex={isActive ? 0 : -1}
      aria-selected={isActive}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
    >
      <div className={styles.row}>
        <p className={styles.title}>{tabTitle}</p>
        {closable ? (
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="탭 닫기"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
