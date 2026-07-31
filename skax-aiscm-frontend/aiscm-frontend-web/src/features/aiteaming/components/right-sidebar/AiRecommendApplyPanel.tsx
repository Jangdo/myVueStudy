import Button from "@/shared/ui/Button/Button";
import styles from "./RightSidebarPanel.module.css";

export function AiRecommendApplyPanel() {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <i className="icon logoSymbol"></i>
        <p className={styles.message}>{"'{역할}'에 대해 AI로 추천된 전체 인력입니다."}</p>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.contentBox}>
          <div className={styles.cardGroup}>
            <div className={styles.cardWrap}>
              <div className={styles.cardHeader}>
                <span className={styles.title}>가중치</span>
              </div>
              <div className={styles.card2}>
                <dl className={styles.dlist}>
                  <div className={styles.row}>
                    <dt>경험</dt>
                    <dd>50%</dd>
                  </div>
                  <div className={styles.row}>
                    <dt>스킬</dt>
                    <dd>50%</dd>
                  </div>
                  <div className={styles.row}>
                    <dt>역할</dt>
                    <dd>20%</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className={styles.cardWrap}>
              <div className={styles.cardHeader}>
                <span className={styles.title}>필터 설정</span>
              </div>
              <div className={styles.card2}>
                <dl className={styles.dlist}>
                  <div className={styles.row}>
                    <dt>조직</dt>
                    <dd>AT 서비스 부문</dd>
                  </div>
                  <div className={styles.row}>
                    <dt>예산</dt>
                    <dd>CP 인건비 무관</dd>
                  </div>
                  <div className={styles.row}>
                    <dt>가용여부</dt>
                    <dd>가용 인력만 보기</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.buttonsRow}>
          <Button variant="outlined" color="assistive" round>선택 적용</Button>
          <Button variant="outlined" color="assistive" round>AI 추천 조건 재설정</Button>
          <Button variant="outlined" color="assistive" round>단가 등급만 지정</Button>
        </div>
        <span className={styles.timeText}>오후 04:46</span>
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.buttonsRow}>
          <Button color="primary" size="lg">선택 적용</Button>
        </div>
      </div>
    </section>
  );
}
