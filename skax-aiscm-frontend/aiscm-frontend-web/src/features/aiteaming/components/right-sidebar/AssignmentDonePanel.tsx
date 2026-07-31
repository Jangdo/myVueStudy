import Button from "@/shared/ui/Button/Button";
import styles from "./RightSidebarPanel.module.css";

export function AssignmentDonePanel() {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <i className="icon logoSymbol"></i>
        <p className={styles.message}>{"'{역할}'에 '{이름}'을 배정했습니다.\nAI추천을 종료할 경우 채팅창은 닫히며 추천 이력은 저장되지 않습니다."}</p>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.buttonsRow}>
          <Button variant="outlined" color="assistive" round>종료하기</Button>
          <Button variant="outlined" color="assistive" round>AI 추천 조건 재설정</Button>
        </div>
        <span className={styles.timeText}>오후 04:46</span>
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.buttonsRow}>
          <Button color="primary" size="lg">종료하기</Button>
        </div>
      </div>
    </section>
  );
}
