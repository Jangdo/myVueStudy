"use client";

import styles from "./AiTeamingUnitProjectKpiRow.module.css";

const KPI_LABEL = "총사업예산 (VAT별도)";
const KPI_VALUE = "1,318억원";

export interface AiTeamingUnitProjectKpiRowProps {
  unitProjectCode?: string;
  unitProjectTitle?: string;
}

export function AiTeamingUnitProjectKpiRow({
  unitProjectCode = "D001",
  unitProjectTitle = "단위 프로젝트 이름",
}: AiTeamingUnitProjectKpiRowProps) {
  return (
    <section className={styles.root}>
      <div className={styles.titleRow}>
        <h2 className={styles.unitTitle}>{unitProjectTitle}</h2>
        <p className={styles.unitCode}>{unitProjectCode}</p>
      </div>
      <div className={styles.kpiGrid}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.kpiItem}>
            <p className={styles.kpiLabel}>{KPI_LABEL}</p>
            <p className={styles.kpiValue}>{KPI_VALUE}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
