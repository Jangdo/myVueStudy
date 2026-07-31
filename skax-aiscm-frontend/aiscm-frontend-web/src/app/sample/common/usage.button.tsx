"use client";

import Button from "@/shared/ui/Button/Button";
import Switch from "@/shared/ui/Button/Switch";
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
            Button
          </h3>
          <p className={styles.sectionHint}>
            Figma: Primary, Assistive, Assistive danger, Submit, Disabled — <code>variant</code> +{" "}
            <code>disabled</code>
          </p>
        </div>
        <div className={styles.body}>
          <h4 className={styles.title}>Style</h4>
          <p className={styles.sectionHint}>Primary, Assistive, danger, Submit, Disabled </p>
          <div className={styles.row}>
            <div className={styles.col}>
              <Button variant="solid" color="primary">
                버튼
              </Button>
              <Button variant="outlined" color="primary">
                버튼
              </Button>
            </div>
            <div className={styles.col}>
              <Button variant="outlined" color="assistive">
                버튼
              </Button>
            </div>
            <div className={styles.col}>
              <Button variant="solid" color="danger">
                버튼
              </Button>
              <Button variant="outlined" color="danger">
                버튼
              </Button>
            </div>
            <div className={styles.col}>
              <Button variant="solid" color="submit">
                버튼
              </Button>
            </div>
            <div className={styles.col}>
              <Button variant="solid" color="primary" disabled>
                disabled
              </Button>
              <Button variant="outlined" color="primary" disabled>
                disabled
              </Button>
            </div>
          </div>

          <h4 className={styles.title}>icon</h4>
          <p className={styles.sectionHint}>icon, iconRight, iconOnly</p>
          <div className={styles.row}>
            <Button variant="outlined" color="primary" icon="clear">
              버튼
            </Button>
            <Button variant="outlined" color="primary" icon="exsearch" iconRight>
              버튼
            </Button>
            <Button variant="outlined" color="primary" icon="exsearch" iconOnly>
              버튼
            </Button>
          </div>
          
          <h4 className={styles.title}>size</h4>
          <p className={styles.sectionHint}>xl, lg, md, sm</p>
          <div className={styles.row}>
            <Button size="xl">
              버튼
            </Button>
            <Button size="lg">
              버튼
            </Button>
            <Button size="md">
              버튼
            </Button>
            <Button size="sm">
              버튼
            </Button>
          </div>

          <h4 className={styles.title}>icon size</h4>
          <div className={styles.row}>
            <Button variant="outlined" color="primary" size="sm" icon="clear">
              버튼
            </Button>
            <Button variant="outlined" color="primary" size="sm" icon="exsearch" iconRight>
              버튼
            </Button>
            <Button variant="outlined" color="primary" size="sm" icon="exsearch" iconOnly>
              버튼
            </Button>
          </div>
          <div className={styles.row}>
            <Button variant="outlined" color="primary" size="md" icon="clear">
              버튼
            </Button>
            <Button variant="outlined" color="primary" size="md" icon="exsearch" iconRight>
              버튼
            </Button>
            <Button variant="outlined" color="primary" size="md" icon="exsearch" iconOnly>
              버튼
            </Button>
          </div>
          <div className={styles.row}>
            <Button variant="outlined" color="primary" size="lg" icon="clear">
              버튼
            </Button>
            <Button variant="outlined" color="primary" size="lg" icon="exsearch" iconRight>
              버튼
            </Button>
            <Button variant="outlined" color="primary" size="lg" icon="exsearch" iconOnly>
              버튼
            </Button>
          </div>
        </div>
      </section>
      <section className={styles.section}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>
            Switch
          </h3>
        </div>
        <div className={styles.row}>
          <Switch label="알림 받기" hideLabel />
          <Switch label="알림 받기" />
          <Switch
            mode="option"
            option1="월간"
            option2="연간"
          />
        </div>
      </section>
    </>
  );
}
