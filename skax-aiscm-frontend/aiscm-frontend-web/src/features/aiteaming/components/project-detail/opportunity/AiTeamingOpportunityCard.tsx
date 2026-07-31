"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { formatKrwFullWon, type AiTeamingOpportunityCardModel } from "@/features/aiteaming/lib/opportunityCardModel";
import styles from "./AiTeamingOpportunityCard.module.css";

export interface AiTeamingOpportunityCardProps {
  model: AiTeamingOpportunityCardModel;
  /** 서버 요약 API 실패 시 안내 (브라우저에서 API 를 호출하지 않음) */
  summaryError?: string | null;
}

function IconBuilding() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4 17V3.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1V17M4 17h12M4 17H3m13 0h-1M8 7h1M8 10h1M11 7h1M11 10h1"
        stroke="#475569"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevronUp() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M6 12l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AiTeamingOpportunityCard({ model, summaryError }: AiTeamingOpportunityCardProps) {
  const [bodyOpen, setBodyOpen] = useState(true);
  const innerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  const modelDigest = [
    model.opportunityCode,
    model.opportunityName,
    model.수행기간,
    model.프로젝트타입,
    model.고객사,
    model.총사업예산,
    model.수주목표금액,
    model.수주귀속조직,
    model.영업대표,
    model.매출귀속조직,
    summaryError ?? "",
  ].join("\0");

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const measure = () => setContentHeight(Math.max(el.scrollHeight, 1));
    measure();

    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [modelDigest]);

  const collapseShellStyle: CSSProperties =
    contentHeight === undefined
      ? bodyOpen
        ? {}
        : { maxHeight: 0 }
      : { maxHeight: bodyOpen ? contentHeight : 0 };

  return (
    <section className={styles.root}>
      <div className={styles.pageMeta}>
        <p className={styles.code}>{model.opportunityCode}</p>
        <h1 className={styles.pageTitle}>{model.opportunityName}</h1>
        {summaryError ? (
          <p className={styles.fetchError} role="status">
            {summaryError}
          </p>
        ) : null}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleRow}>
            <IconBuilding />
            <h2 className={styles.cardTitle}>사업기회 정보</h2>
          </div>
          <button
            type="button"
            className={styles.collapseBtn}
            aria-expanded={bodyOpen}
            aria-controls="opportunity-card-detail-grid"
            aria-label={bodyOpen ? "사업기회 상세 접기" : "사업기회 상세 펼치기"}
            onClick={() => setBodyOpen((v) => !v)}
          >
            <span className={bodyOpen ? undefined : styles.collapseBtnChevronFlipped} aria-hidden>
              <IconChevronUp />
            </span>
          </button>
        </div>

        <div className={styles.gridCollapseShell} style={collapseShellStyle}>
          <div
            ref={innerRef}
            id="opportunity-card-detail-grid"
            className={styles.grid}
            aria-hidden={!bodyOpen}
          >
            <div className={styles.blockGray}>
              <div className={styles.rowPair}>
                <span className={styles.label}>수행기간</span>
                <span className={styles.value}>{model.수행기간}</span>
              </div>
              <div className={styles.rowPair}>
                <span className={styles.label}>프로젝트타입</span>
                <span className={styles.value}>{model.프로젝트타입}</span>
              </div>
              <div className={styles.rowPair}>
                <span className={styles.label}>고객사</span>
                <span className={styles.value}>{model.고객사}</span>
              </div>
            </div>

            <div className={styles.blockBlue}>
              <div className={styles.colStack}>
                <span className={styles.label}>총사업예산 (VAT별도)</span>
                <span className={styles.value}>{formatKrwFullWon(model.총사업예산)}</span>
              </div>
              <div className={styles.colStack}>
                <span className={styles.label}>수주목표금액 (VAT별도)</span>
                <span className={styles.value}>{formatKrwFullWon(model.수주목표금액)}</span>
              </div>
            </div>

            <div className={styles.blockYellow}>
              <div className={styles.yellowCol}>
                <span className={styles.label}>수주귀속조직</span>
                <span className={styles.value}>{model.수주귀속조직}</span>
              </div>
              <div className={styles.yellowCol}>
                <span className={styles.label}>영업대표</span>
                <span className={styles.value}>{model.영업대표}</span>
              </div>
              <div className={styles.yellowCol}>
                <span className={styles.label}>매출귀속조직</span>
                <span className={styles.value}>{model.매출귀속조직}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
