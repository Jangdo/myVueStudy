"use client";

import Badge from "@/shared/ui/Badge/Badge";
import styles from "./usagePublic.module.css";

/**
 * Figma 5스타일 대응(텍스트는 Figma export 예시와 동일)
 */
export default function ButtonUsageExample() {
  return (
    <>
      <section className={styles.section}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>
            Badge
          </h3>
        </div>
        <div className={styles.body}>

          <h4 className={styles.title}>Option</h4>
          <p className={styles.sectionHint}>type, color, size, rounded, icon, disabled</p>
          <div className={styles.row}>
            <Badge
                type="type1"
                color="blue"
              >
                badge1
              </Badge>
              <Badge
                type="type1"
                color="blue"
                icon="download"
                disabled
                rounded
              >
                badge2
              </Badge>
          </div>

          <h4 className={styles.title}>Size</h4>
          <p className={styles.sectionHint}>sm, md, lg</p>
          <div className={styles.row}>
            <Badge
                type="type1"
                color="blue"
                size="sm"
              >
                sm
              </Badge>
              <Badge
                type="type1"
                color="blue"
                size="md"
              >
                md
              </Badge>
              <Badge
                type="type1"
                color="blue"
                size="lg"
              >
                lg
              </Badge>
          </div>

          <h4 className={styles.title}>Type1</h4>
          <p className={styles.sectionHint}>blue, green ...</p>
          <div className={styles.row}>
            <Badge
              type="type1"
              color="blue"
            >
              가용
            </Badge>
            <Badge
              type="type1"
              color="blue2"
            >
              투입 예약
            </Badge>
            <Badge
              type="type1"
              color="green"
            >
              투입 중
            </Badge>
            <Badge
              type="type1"
              color="purple"
            >
              투입 확정
            </Badge>
          </div>

          <div className={styles.row}>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Badge
                type="type1"
                color="blue"
                icon="download"
              >
                Outline
              </Badge>

              <Badge
                type="type2"
                color="primary"
                size="lg"
                icon="download"
              >
                Filled
              </Badge>

              <Badge
                type="type3"
                color="danger"
                disabled
              >
                Disabled
              </Badge>
            </div>
          </div>

          <div className={styles.row}>
             <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <Badge
                  type="type1"
                  color="blue"
                  size="sm"
                >
                  Small
                </Badge>

                <Badge
                  type="type2"
                  color="secondary"
                  size="md"
                >
                  Medium
                </Badge>

                <Badge
                  type="type3"
                  color="danger"
                  size="lg"
                >
                  Large
                </Badge>

                <Badge
                  className="custom-badge"
                >
                  Custom Class
                </Badge>

                <Badge
                  className="custom-badge"
                  rounded={false}
                >
                  Custom Class
                </Badge>
              </div>

          </div>
        </div>
      </section>
    </>
  );
}
