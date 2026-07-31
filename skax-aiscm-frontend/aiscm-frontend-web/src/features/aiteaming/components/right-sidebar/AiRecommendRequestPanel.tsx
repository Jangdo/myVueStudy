import Button from "@/shared/ui/Button/Button";
import styles from "./RightSidebarPanel.module.css";

export function AiRecommendRequestPanel() {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <i className="icon logoSymbol"></i>
        <p className={styles.message}>설정한 조건으로 새로운 인력을 추천할까요?</p>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.buttonsRow}>
          <Button variant="outlined" color="assistive" round>AI 추천 받기</Button>
          <Button variant="outlined" color="assistive" round>필터 설정</Button>
          <Button variant="outlined" color="assistive" round>가중치 조절</Button>
        </div>
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
