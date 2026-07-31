import type { Metadata } from "next";
import Link from "next/link";
import PageBody from "./pageBody";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "공통 컴포넌트 | SCM",
  description: "components/common 모아보기 (토큰 + Button, Checkbox)",
};

export default function SampleCommonPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.back}>
          <Link href="/sample">← 샘플 메인</Link>
        </p>
        <h1 className={styles.title}>공통 컴포넌트</h1>
        <p className={styles.lead}>
          <code>src/components/common</code> · <code>src/styles/common/tokens.css</code>
        </p>
      </header>

      <main>
        <PageBody />
      </main>
    </div>
  );
}
