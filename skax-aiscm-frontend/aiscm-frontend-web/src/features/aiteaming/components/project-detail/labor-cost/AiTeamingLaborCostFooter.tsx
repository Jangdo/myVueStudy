"use client";

import styles from "./AiTeamingLaborCostFooter.module.css";

function IconCoins() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <ellipse cx="10" cy="5" rx="6" ry="2.5" stroke="#475569" strokeWidth="1.3" />
      <path d="M4 5v3c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V5" stroke="#475569" strokeWidth="1.3" />
      <path d="M4 10v3c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-3" stroke="#475569" strokeWidth="1.3" />
    </svg>
  );
}

export interface AiTeamingLaborCostFooterProps {
  totalLabel?: string;
  limitLabel?: string;
  totalAmount?: string;
  limitAmount?: string;
  hint?: string;
}

export function AiTeamingLaborCostFooter({
  totalAmount = "81,896,805원",
  hint = "반려된 인력의 인건비를 제외한 합계입니다.",
}: AiTeamingLaborCostFooterProps) {
  return (
    <footer className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.topRow}>
          <div className={styles.titleRow}>
            <IconCoins />
            <p className={styles.title}>
              총 인건비
              {/* <span className={styles.titleMuted}>/ 인건비 한도</span> */}
            </p>
          </div>
          <div className={styles.right}>
            <p className={styles.hint}>{hint}</p>
            <div className={styles.prices}>
              <span className={styles.pricePrimary}>{totalAmount}</span>
              {/* <span className={styles.priceSep}> / </span>
              <span className={styles.priceLimit}>{limitAmount}</span> */}
            </div>
          </div>
          <div className={styles.buttonArea}>
            <button type="button" className={styles.editBtn}>
              임시저장
            </button>
            <button type="button" className={styles.btnPrimary}>
              AI PMO 보내기
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
