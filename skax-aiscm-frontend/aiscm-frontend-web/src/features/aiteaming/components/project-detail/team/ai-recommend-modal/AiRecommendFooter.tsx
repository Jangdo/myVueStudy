import styles from "./AiRecommendFooter.module.css";

interface AiRecommendFooterProps {
  disabled: boolean;
  onAssign: () => void;
}

export function AiRecommendFooter({ disabled, onAssign }: AiRecommendFooterProps) {
  return (
    <div className={styles.footer}>
      <button type="button" className={styles.assignBtn} disabled={disabled} onClick={onAssign}>
        역할 배정
      </button>
    </div>
  );
}
