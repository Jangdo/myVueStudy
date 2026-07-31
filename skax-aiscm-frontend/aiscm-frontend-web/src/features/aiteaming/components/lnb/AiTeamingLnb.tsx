"use client";

import Image from "next/image";
import { useState } from "react";
import { useAiTeamingWorkspaceOptional } from "@/features/aiteaming/contexts/AiTeamingWorkspaceContext";
import styles from "./AiTeamingLnb.module.css";
import type { ScmLnbType } from "./scmLnb.types";

/** 접힘 시 목록에 보이는 프로젝트 행 수 — 초과분은 펼치기로 표시 */
const PROJECT_LIST_COLLAPSE_MAX = 5;

/** LNB 섹션 타이틀 옆 아이콘 — Figma 로컬 에셋 URL 대신 인라인(오프라인·CI 안정) */
function IconSectionAiTeaming() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12.6 15.9v-1.3A2.6 2.6 0 0 0 10 12H6.1a2.6 2.6 0 0 0-2.6 2.6v1.3"
        stroke="#101828"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.05 9.4a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2"
        stroke="#101828"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 15.9v-1.3a2.6 2.6 0 0 0-1.95-2.52"
        stroke="#101828"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.6 4.28a2.6 2.6 0 0 1 0 5.04"
        stroke="#101828"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface AiTeamingLnbProps {
  activeProjectCode?: string;
  /** Figma `Open` — true: 펼침(256px), false: 접힘(64px) */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Figma `Type` — 선택 행·입찰 전용 검색바 등 */
  scmType: ScmLnbType;
}

function phaseDotClass(phase: ScmLnbType): string {
  switch (phase) {
    case "영업":
      return styles.dotSales;
    case "입찰":
      return styles.dotBid;
    case "계약":
      return styles.dotContract;
    case "수행":
      return styles.dotExec;
    default:
      return styles.dotSales;
  }
}

function activeRowClass(scmType: ScmLnbType): string {
  switch (scmType) {
    case "영업":
      return styles.itemActiveSales;
    case "입찰":
      return styles.itemActiveBid;
    case "계약":
      return styles.itemActiveContract;
    case "수행":
      return styles.itemActiveExec;
    default:
      return styles.itemActiveSales;
  }
}

/** Figma 533:1325 접힘 상태 전용 심볼 */
function IconAxgenticWireCollapsed() {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden>
      <circle cx="9" cy="10" r="2.35" fill="#ffffff" />
      <circle cx="9" cy="3.95" r="2.35" fill="#ffffff" />
      <circle cx="2.95" cy="8.2" r="2.35" fill="#ffffff" />
      <circle cx="15.05" cy="8.2" r="2.35" fill="#ffffff" />
      <circle cx="5.05" cy="15.65" r="2.35" fill="#ffffff" />
      <circle cx="12.95" cy="15.65" r="2.35" fill="#ffffff" />
    </svg>
  );
}

function IconPanelCollapse() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.35" />
      <path d="M5 2v10" stroke="currentColor" strokeWidth="1.35" />
    </svg>
  );
}

function IconPanelExpand() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.35" />
      <path d="M9 2v10" stroke="currentColor" strokeWidth="1.35" />
    </svg>
  );
}

function IconMore() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <circle cx="2" cy="6" r="1.2" fill="currentColor" />
      <circle cx="6" cy="6" r="1.2" fill="currentColor" />
      <circle cx="10" cy="6" r="1.2" fill="currentColor" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconMinus() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2 6h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 3a4 4 0 0 0-4 4v2.5l-1 2V13h10v-1.5l-1-2V7a4 4 0 0 0-4-4Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M8 14a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.14 2.9c.51 0 1 .2 1.37.55.36.36.57.84.57 1.35v.21a.7.7 0 0 0 .28.46l.08.05.28.16a.8.8 0 0 0 .74 0h.02l.08-.05a1.96 1.96 0 0 1 2.63.69l.15.25a1.87 1.87 0 0 1-.7 2.6l-.1.05h-.01a1 1 0 0 0-.27.27q-.1.16-.1.34v.33q0 .19.1.35t.27.26l.08.04.02.01c.44.25.77.67.9 1.16s.06 1-.2 1.44h.01l-.15.25v.01a1.96 1.96 0 0 1-2.63.7v-.01l-.08-.04-.02-.01a.8.8 0 0 0-.74 0l-.28.16a1 1 0 0 0-.27.26q-.1.16-.1.34v.12c0 .5-.2 1-.56 1.35s-.86.55-1.37.55h-.29c-.5 0-1-.2-1.36-.55a2 2 0 0 1-.57-1.35v-.21a1 1 0 0 0-.1-.25 1 1 0 0 0-.26-.26l-.29-.16a.8.8 0 0 0-.74 0h-.01l-.09.05a1.96 1.96 0 0 1-2.62-.69l-.15-.25a1.87 1.87 0 0 1 .7-2.6l.1-.05q.18-.1.27-.27.1-.15.1-.35v-.33l-.01-.08a1 1 0 0 0-.09-.26 1 1 0 0 0-.3-.27l-.1-.07a1.87 1.87 0 0 1-.67-2.58l.15-.25a1.96 1.96 0 0 1 2.63-.7l.08.05.01.01a.8.8 0 0 0 .66.04l.08-.04.29-.16q.17-.1.27-.26.1-.15.1-.34V4.8c0-.5.2-1 .56-1.35s.85-.55 1.36-.55zm-.29 1.2q-.3 0-.52.21-.2.2-.2.49v.12a1.9 1.9 0 0 1-.98 1.64l-.28.17a2 2 0 0 1-1.9 0l-.1-.05h-.03a.8.8 0 0 0-.56-.08.7.7 0 0 0-.44.33l-.15.25a.7.7 0 0 0 .15.86l.12.09.03.02.1.06a1.9 1.9 0 0 1 .94 1.62v.46a1.9 1.9 0 0 1-.97 1.52l-.1.06a.7.7 0 0 0-.34.43.7.7 0 0 0 .07.52l.15.25q.15.25.44.33.31.07.56-.07l.02-.01.1-.06a2 2 0 0 1 1.8-.05l.1.06.3.17.1.06a1.9 1.9 0 0 1 .86 1.58v.12q0 .28.21.49t.52.21h.3q.3 0 .52-.21.2-.2.2-.49v-.12a1.9 1.9 0 0 1 .98-1.64l.28-.17a2 2 0 0 1 1.9 0l.1.05h.02q.26.15.56.08a.7.7 0 0 0 .45-.33l.14-.25q.15-.25.07-.53a.7.7 0 0 0-.33-.42l-.08-.04-.02-.01a1.9 1.9 0 0 1-.97-1.66v-.32a1.9 1.9 0 0 1 .96-1.65l.1-.06a.7.7 0 0 0 .34-.43.7.7 0 0 0-.07-.52l-.14-.25a.7.7 0 0 0-.45-.33.8.8 0 0 0-.56.07l-.02.01-.1.06a2 2 0 0 1-1.9-.01l-.29-.17a1.9 1.9 0 0 1-.96-1.64V4.8a.7.7 0 0 0-.21-.49.8.8 0 0 0-.53-.21zM10 7.4a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2m0 1.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8"
        fill="#6B7280"
      />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={styles.chevron} aria-hidden>
      <path d="M8 5l4 5-4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 3 3 6.5 10 10l7-3.5L10 3ZM3 10.5 10 14l7-3.5M3 14.5 10 18l7-3.5"
        stroke="#64748b"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg className={styles.searchIcon} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function AiTeamingLnb({ activeProjectCode, open, onOpenChange, scmType }: AiTeamingLnbProps) {
  const [projectListExpanded, setProjectListExpanded] = useState(false);
  const workspace = useAiTeamingWorkspaceOptional();
  const projects = workspace?.projectList ?? [];
  const profileName = workspace?.userDetail?.usrNm?.trim()
    ? `${workspace.userDetail.usrNm.trim()} 매니저`
    : "—";
  const profileTeam = workspace?.userDetail?.currAffltOrgNm?.trim() || "—";
  const showSearchBar = open && scmType === "입찰";
  const activeCls = activeRowClass(scmType);
  const projectCount = projects.length;
  const needsProjectListExpand = projectCount > PROJECT_LIST_COLLAPSE_MAX;
  const visibleProjects =
    needsProjectListExpand && !projectListExpanded
      ? projects.slice(0, PROJECT_LIST_COLLAPSE_MAX)
      : projects;

  const middleStackClass =
    scmType === "수행"
      ? `${styles.middleStack} ${styles.middleStackPerform}`
      : scmType === "계약"
        ? `${styles.middleStack} ${styles.middleStackContract}`
        : styles.middleStack;

  if (!open) {
    return (
      <aside
        className={`${styles.aside} ${styles.asideCollapsed}`}
        data-scm-type={scmType}
        data-scm-open="false"
        aria-label="SCM LNB 접힘"
      >
        <div className={styles.collapsedColumn}>
          <div>
            <div className={styles.collapsedTop}>
              <button type="button" className={styles.collapsedLogoBtn} aria-label="홈" title="SCM">
                <span className={styles.collapsedLogoMark} aria-hidden>
                  <IconAxgenticWireCollapsed />
                </span>
              </button>
              <button
                type="button"
                className={styles.toggleBtn}
                aria-label="사이드바 펼치기"
                onClick={() => onOpenChange(true)}
              >
                <IconPanelExpand />
              </button>
            </div>
            <button
              type="button"
              className={styles.collapsedProjectCard}
              title="프로젝트"
              onClick={() => {
                const fallback = activeProjectCode ?? projects[0]?.pjtNo;
                if (fallback) {
                  void workspace?.openProjectTab(fallback);
                }
              }}
            >
              <IconLayers />
              <span className={styles.badgeCount}>{projectCount}</span>
            </button>
          </div>
          <div className={styles.collapsedSpacer} />
          <div>
            <div className={styles.collapsedIconActions}>
              <button type="button" className={styles.collapsedIconBtn} aria-label="Alarm">
                <IconBell />
              </button>
              <button type="button" className={styles.collapsedIconBtn} aria-label="Settings">
                <IconGear />
              </button>
            </div>
            <div className={styles.collapsedProfile}>
              <div className={styles.avatar} aria-hidden title={profileName} />
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={`${styles.aside} ${styles.asideOpen}`} data-scm-type={scmType} data-scm-open="true" aria-label="SCM LNB">
      <div className={styles.innerOpen}>
        <div className={styles.topRow}>
          <div className={styles.logoRow}>
            <div className={styles.logoMark} aria-hidden>
              <Image src="/axgenticwire-mark.svg" width={28} height={26} alt="" />
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoTitle} aria-label="AXGENTIC WIRE">
                <span className={styles.brandWordmark} aria-hidden>
                  <span className={styles.brandAxgentic}>AXGENTIC</span>
                  <span className={styles.brandWire}>WIRE</span>
                </span>
              </span>
              <span className={styles.logoSub}>AI SCM</span>
            </div>
          </div>
          <button type="button" className={styles.toggleBtn} aria-label="사이드바 접기" onClick={() => onOpenChange(false)}>
            <IconPanelCollapse />
          </button>
        </div>

        <div className={middleStackClass}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionTitleIconFrame} aria-hidden>
              <IconSectionAiTeaming />
            </span>
            <span className={styles.sectionTitleText}>AI Teaming</span>
          </div>

          <div className={styles.projectCard}>
            <div className={styles.listInner}>
              {showSearchBar && (
                <div className={styles.searchPill}>
                  <IconSearch />
                  <input className={styles.searchInput} type="search" placeholder="B금융 차세대" aria-label="프로젝트 검색" />
                </div>
              )}
              <div className={styles.projectList}>
                {visibleProjects.map((p) => {
                  const active = activeProjectCode === p.pjtNo;
                  return (
                    <button
                      type="button"
                      key={p.pjtNo}
                      className={`${styles.projectItem} ${active ? activeCls : ""}`}
                      onClick={() => {
                        void workspace?.openProjectTab(p.pjtNo);
                      }}
                    >
                      <span className={`${styles.phaseDot} ${phaseDotClass("입찰")}`} title="입찰" aria-hidden />
                      <span className={styles.projectName}>{p.pjtNm ?? p.pjtNo}</span>
                      <IconMore />
                    </button>
                  );
                })}
              </div>
              {needsProjectListExpand ? (
                <button
                  type="button"
                  className={`${styles.expandBtn} ${scmType === "입찰" ? styles.expandBtnBid : ""}`}
                  aria-expanded={projectListExpanded}
                  onClick={() => setProjectListExpanded((v) => !v)}
                >
                  {projectListExpanded ? <IconMinus /> : <IconPlus />}
                  {projectListExpanded ? "접기" : "펼치기"}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className={styles.spacer} />

        <div className={styles.footerLinks}>
          <button type="button" className={styles.footerLink}>
            <IconBell />
            Alarm
          </button>
          <button type="button" className={styles.footerLink}>
            <IconGear />
            Settings
          </button>
        </div>

        <div className={styles.profileBlock}>
          <div className={styles.avatar} aria-hidden />
          <div className={styles.profileMeta}>
            <div className={styles.profileName}>{profileName}</div>
            <div className={styles.profileTeam}>{profileTeam}</div>
          </div>
          <IconChevronRight />
        </div>
      </div>
    </aside>
  );
}
