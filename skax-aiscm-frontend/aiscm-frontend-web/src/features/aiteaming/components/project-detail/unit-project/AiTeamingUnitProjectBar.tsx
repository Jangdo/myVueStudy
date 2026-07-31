"use client";

import styles from "./AiTeamingUnitProjectBar.module.css";

export interface AiTeamingUnitProjectBarProps {
  /** 프로젝트 요약 기반 상단 제목 (예: pjtNm) */
  title?: string;
}

export function AiTeamingUnitProjectBar({ title = "담당 팀원" }: AiTeamingUnitProjectBarProps) {
  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{title}</h2>
      {/* <div className={styles.controls}>
        <span className={styles.controlLabel}>프로젝트</span>
        <select className={styles.select} aria-label="사업기회 필터" defaultValue="opp">
          <option value="opp">사업기회</option>
        </select>
        <select className={`${styles.select} ${styles.selectWide}`} aria-label="프로젝트명 필터" defaultValue="name">
          <option value="name">프로젝트명</option>
        </select>
      </div> */}
    </div>
  );
}
