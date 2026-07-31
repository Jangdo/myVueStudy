"use client";

import Checkbox from "@/shared/ui/Checkbox/Checkbox";
import styles from "./usagePublic.module.css";

/**
 * Checkbox 사용 예시 (Figma 4상태 대응).
 * `(design)`·스토리북 등에서 import 하거나, 복사용 참고로만 사용. 프로덕션 라우트에 직접 넣지 말 것.
 */
export default function CheckboxUsageExample() {
  return (
    <>
      <section className={styles.section}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>
            Checkbox
          </h3>
        </div>
        <div className={styles.body}>
          <h4 className={styles.title}>color</h4>
          <div className={styles.row}>
            <Checkbox defaultChecked={false}>미선택 (unchecked)</Checkbox>
            <Checkbox defaultChecked>선택 (checked)</Checkbox>
            <Checkbox defaultChecked>선택 항목이 <br />두줄인 경우 정렬</Checkbox>
            <Checkbox disabled defaultChecked={false}>disabled·미선택</Checkbox>
            <Checkbox disabled defaultChecked>disabled·선택</Checkbox>
          </div>
        </div>
      </section>
    </>
  );
}
