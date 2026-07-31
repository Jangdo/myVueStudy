"use client";

import Icon from "@/shared/ui/Icon/IconSvg";
import styles from "./usagePublic.module.css";

/**
 * Figma 5스타일 대응(텍스트는 Figma export 예시와 동일)
 */
export default function ButtonUsageExample() {
  const isOpen = true;
  return (
    <>
      <section className={styles.section}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>
            Icon SVG
          </h3>
          <p className={styles.headerText}>name, size, color</p>
        </div>
        <div className={styles.body}>
          <div className={styles.row}>
            <Icon iconName="exsearch" />
            <Icon iconName="exclose" />
            <Icon iconName="excheck" />
            <Icon iconName="exsearch" width={80} height={80} color="green" />
          </div>
          <div className={styles.row}>
            <Icon iconName="formCheck" />
            <Icon iconName="clear" />
          </div>
          <div className={styles.row}>
            <Icon iconName="exsearch" color="green" className="aaa" />
            <Icon iconName={isOpen  ? "exclose" : "exsearch"} />
          </div>
        </div>
        <div className={styles.body}>
          <div className={styles.row}>
            <Icon iconName="download" />
          </div>
        </div>
      </section>
    </>
  );
}
