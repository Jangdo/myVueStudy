import styles from "./AiRecommendModalHeader.module.css";

interface AiRecommendModalHeaderProps {
  titleId: string;
  onClose: () => void;
}

function IconClose() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AiRecommendModalHeader({
  titleId,
  onClose,
}: AiRecommendModalHeaderProps) {
  return (
    <div className={styles.header}>
      <h2 id={titleId} className={styles.title}>
        AI 추천 인력
      </h2>
      <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="닫기">
        <IconClose />
      </button>
    </div>
  );
}
