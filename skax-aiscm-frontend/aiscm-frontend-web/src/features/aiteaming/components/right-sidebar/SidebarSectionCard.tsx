import type { ReactNode } from "react";
import styles from "./SidebarSectionCard.module.css";

export interface SidebarSectionCardProps {
  title: string;
  children?: ReactNode;
}

export function SidebarSectionCard({ title, children }: SidebarSectionCardProps) {
  return (
    <section className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.body}>{children ?? "pub 작업 예정"}</div>
    </section>
  );
}
