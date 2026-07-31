import Button from "@/shared/ui/Button/Button";
import styles from "./RightSidebarPanel.module.css";

export function WeightAdjustPanel() {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <i className="icon logoSymbol"></i>
        <p className={styles.message}>{"'{역할}'에 적용할 AI 추천 조건을 재설정 합니다.\n조정할 항목을 선택해주세요."}</p>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.buttonsRow}>
          <Button variant="outlined" color="assistive" round>가중치 조절</Button>
          <Button variant="outlined" color="assistive" round>필터 설정</Button>
        </div>
        <span className={styles.timeText}>오후 04:46</span>
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.buttonsRow}>
          <Button color="primary" size="lg">가중치 조절</Button>
        </div>
      </div>
    </section>
  );
}
