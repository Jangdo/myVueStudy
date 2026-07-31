"use client";

import styles from "./AiTeamingRightSidebar.module.css";
import { AiRecommendMembersPanel } from "./AiRecommendMembersPanel";
import { WeightAdjustPanel } from "./WeightAdjustPanel";
import { WeightAdjustDonePanel } from "./WeightAdjustDonePanel";
import { AiRecommendRequestPanel } from "./AiRecommendRequestPanel";
import { AiRecommendApplyPanel } from "./AiRecommendApplyPanel";
import { AssignmentDonePanel } from "./AssignmentDonePanel";

export interface AiTeamingRightSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function IconPanelCollapse() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.35" />
      <path d="M9 2v10" stroke="currentColor" strokeWidth="1.35" />
    </svg>
  );
}

function IconPanelExpand() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.35" />
      <path d="M5 2v10" stroke="currentColor" strokeWidth="1.35" />
    </svg>
  );
}

export function AiTeamingRightSidebar({ open, onOpenChange }: AiTeamingRightSidebarProps) {
  if (!open) {
    return (
      <aside className={`${styles.aside} ${styles.asideCollapsed}`} aria-label="우측 사이드 패널 접힘">
        <button
          type="button"
          className={styles.toggleBtn}
          aria-label="우측 사이드 패널 펼치기"
          onClick={() => onOpenChange(true)}
        >
          <IconPanelExpand />
        </button>
      </aside>
    );
  }

  return (
    <aside className={`${styles.aside} ${styles.asideOpen}`} aria-label="우측 사이드 패널">
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <button
            type="button"
            className={styles.toggleBtn}
            aria-label="우측 사이드 패널 접기"
            onClick={() => onOpenChange(false)}
          >
            <IconPanelCollapse />
          </button>
          <h2 className={styles.panelTitle}>AI Teaming 우측 패널</h2>
        </div>
        <div className={styles.scrollArea}>
          <AiRecommendMembersPanel />
          <WeightAdjustPanel />
          <WeightAdjustDonePanel />
          <AiRecommendRequestPanel />
          <AiRecommendApplyPanel />
          <AssignmentDonePanel />
        </div>
      </div>
    </aside>
  );
}
