import Button from "@/shared/ui/Button/Button";
import styles from "./RightSidebarPanel.module.css";

export function WeightAdjustDonePanel() {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <i className="icon logoSymbol"></i>
        <p className={styles.message}>팝업에서 가중치 조절을 완료해주세요.</p>
      </div>
      <div className={styles.cardContent}>
        <span className={styles.timeText}>오후 04:46</span>
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.buttonsRow}>
          <Button color="primary" size="lg">완료</Button>
        </div>
      </div>
    </section>
  );
}
