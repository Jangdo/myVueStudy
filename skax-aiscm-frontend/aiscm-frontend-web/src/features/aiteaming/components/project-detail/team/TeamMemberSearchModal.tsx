"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AppMessageDialog } from "@/shared/ui/AppDialog";
import {
  mapHresourceDetailToSearchRow,
  searchModalRowToRecommendRow,
  type SearchModalTableRow,
} from "@/features/aiteaming/lib/hresourceSearchMap";
import { aiteamingAssignmentService } from "@/features/aiteaming/services/aiteamingAssignmentService";
import { aiteamingHresourceService } from "@/features/aiteaming/services/aiteamingHresourceService";
import {
  AITEAMING_MP_SELCT_TP_DIRECT_INPUT,
  buildAssignmentRegisterRequest,
} from "@/features/aiteaming/types/assignments";
import type { RecommendRow } from "./ai-recommend-modal/types";
import type { AiTeamingStaffingMember } from "./teamMembersFromApi";
import styles from "./TeamMemberSearchModal.module.css";

export interface TeamMemberSearchModalProps {
  open: boolean;
  onClose: () => void;
  assignRole: string;
  pjtRoleDmndId: string;
  sourceRow: AiTeamingStaffingMember | null;
  onAssigned?: (selected: RecommendRow, source: AiTeamingStaffingMember) => void | Promise<void>;
}

type BadgeVariantPerson = "blue" | "blue2" | "violet" | "green";
type BadgeVariantProject = "blue2" | "violet" | "green";

function badgeClass(v: BadgeVariantPerson | BadgeVariantProject): string {
  switch (v) {
    case "blue":
      return `${styles.badge} ${styles.badgeBlue}`;
    case "blue2":
      return `${styles.badge} ${styles.badgeBlue2}`;
    case "violet":
      return `${styles.badge} ${styles.badgeViolet}`;
    case "green":
      return `${styles.badge} ${styles.badgeGreen}`;
    default:
      return styles.badge;
  }
}

function IconClose() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconSearch20() {
  return (
    <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconChevronRightLink() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M3.5 2L6.5 5l-3 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTriangle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">
      <path
        d="M4.37572 2.29957L6.77498 5.04027C7.05797 5.36354 6.8284 5.86961 6.39877 5.86961H1.60254C1.17301 5.86961 0.943402 5.36376 1.22617 5.04045L3.62315 2.29974C3.8223 2.07203 4.17647 2.07195 4.37572 2.29957Z"
        fill="#5F6675"
      />
    </svg>
  );
}

function IconAlertCircle() {
  return (
    <svg className={styles.alertIcon} width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
      <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1" />
      <path d="M5.5 3.2V6M5.5 7.2v.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function TeamMemberSearchModal({
  open,
  onClose,
  assignRole,
  pjtRoleDmndId,
  sourceRow,
  onAssigned,
}: TeamMemberSearchModalProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  /** Enter 제출 이후 마지막 검색어(`null`이면 아직 검색 안 함) */
  const [lastSearchKeyword, setLastSearchKeyword] = useState<string | null>(null);
  const [rows, setRows] = useState<SearchModalTableRow[]>([]);
  const [totalShown, setTotalShown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [messageDialog, setMessageDialog] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "안내",
    message: "",
  });
  const queryInputRef = useRef<HTMLInputElement>(null);
  const roleDemandId = (pjtRoleDmndId ?? "").trim();

  const runSearch = useCallback(async (keyword: string) => {
    const q = keyword.trim();
    if (q.length === 0) {
      setRows([]);
      setTotalShown(0);
      setFetchError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      const detail = await aiteamingHresourceService.searchByKeyword(q);
      setRows([mapHresourceDetailToSearchRow(detail)]);
      setTotalShown(1);
    } catch (e) {
      setRows([]);
      setTotalShown(0);
      setFetchError(e instanceof Error ? e.message : "검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setLastSearchKeyword(null);
    setRows([]);
    setTotalShown(0);
    setFetchError(null);
    setSelectedId(null);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setAssigning(false);
    }
  }, [open]);

  const handleSearchSubmit = useCallback(() => {
    const trimmed = query.trim();
    setLastSearchKeyword(trimmed);
    void runSearch(query);
  }, [query, runSearch]);

  const handleAssign = () => {
    if (!selectedId || !sourceRow) {
      return;
    }
    const selected = rows.find((r) => r.id === selectedId);
    if (!selected) {
      setMessageDialog({ open: true, title: "안내", message: "선택한 검색 결과를 찾을 수 없습니다." });
      return;
    }
    const empNo = (selected.person.empId ?? "").trim();
    if (!empNo) {
      setMessageDialog({
        open: true,
        title: "안내",
        message: "유효한 사원번호(empNo)가 없어 역할 배정을 요청할 수 없습니다.",
      });
      return;
    }
    let body;
    try {
      body = buildAssignmentRegisterRequest(roleDemandId, empNo);
    } catch (e) {
      setMessageDialog({
        open: true,
        title: "안내",
        message: e instanceof Error ? e.message : "배정 요청 본문을 만들 수 없습니다.",
      });
      return;
    }

    setAssigning(true);
    void (async () => {
      try {
        await aiteamingAssignmentService.postRegister(AITEAMING_MP_SELCT_TP_DIRECT_INPUT, body);
        const recommendRow = searchModalRowToRecommendRow(selected, assignRole);
        try {
          await onAssigned?.(recommendRow, sourceRow);
        } catch (refreshErr) {
          console.error(refreshErr);
          setMessageDialog({
            open: true,
            title: "안내",
            message:
              refreshErr instanceof Error
                ? `배정은 완료되었으나 목록 갱신에 실패했습니다: ${refreshErr.message}`
                : "배정은 완료되었으나 목록 갱신에 실패했습니다. 페이지를 새로고침해 주세요.",
          });
        }
        onClose();
      } catch (e) {
        setMessageDialog({
          open: true,
          title: "오류",
          message: e instanceof Error ? e.message : "역할 배정이 정상 처리되지 않았습니다. 다시 시도해 주세요.",
        });
      } finally {
        setAssigning(false);
      }
    })();
  };

  if (!mounted || !open) return null;

  const emptyMessage =
    lastSearchKeyword === null
      ? "이름 또는 사번을 입력한 뒤 Enter로 검색하세요."
      : lastSearchKeyword === ""
        ? "검색어를 입력한 뒤 Enter로 검색하세요."
        : "검색 결과가 없습니다.";
  const node = (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            검색하기
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="닫기">
            <IconClose />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.fieldRow}>
            <div className={styles.scopeField}>
              <label htmlFor="team-search-scope" className={styles.visuallyHidden}>
                검색 범위
              </label>
              <select id="team-search-scope" className={styles.scopeSelect} defaultValue="org">
                <option value="org">전사</option>
                <option value="dept">본부</option>
                <option value="team">팀</option>
              </select>
            </div>
            <div className={styles.searchFieldWrap}>
              <label htmlFor="team-search-query" className={styles.visuallyHidden}>
                이름 또는 사번
              </label>
              <input
                ref={queryInputRef}
                id="team-search-query"
                className={styles.searchInput}
                type="search"
                placeholder="이름 또는 사번을 입력하세요."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                autoComplete="off"
              />
              <IconSearch20 />
            </div>
          </div>

          <div className={styles.tableScroll}>
            <p className={styles.listHead} aria-live="polite">
              총 <span className={styles.listHeadNum}>{loading ? "…" : totalShown}</span> 건
            </p>
            {fetchError ? (
              <p className={styles.fetchError} role="status">
                {fetchError}
              </p>
            ) : null}
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th className={styles.colRadio} scope="col">
                    <span className={styles.visuallyHidden}>선택</span>
                  </th>
                  <th className={styles.colState} scope="col">
                    상태
                  </th>
                  <th className={styles.colProfile} scope="col">
                    프로필
                  </th>
                  <th className={styles.colProject} scope="col">
                    투입 프로젝트
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && !loading && !fetchError ? (
                  <tr>
                    <td colSpan={4} className={styles.tdEmpty}>
                      {emptyMessage}
                    </td>
                  </tr>
                ) : null}
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className={styles.colRadio}>
                      <input
                        className={styles.radio}
                        type="radio"
                        name="team-member-search"
                        checked={selectedId === row.id}
                        onChange={() => setSelectedId(row.id)}
                        aria-label={`${row.person.name} 선택`}
                      />
                    </td>
                    <td className={styles.colState}>
                      <span className={badgeClass(row.personStatus.variant)}>
                        {row.personStatus.label}
                        {row.personStatus.alert ? <IconAlertCircle /> : null}
                      </span>
                    </td>
                    <td className={styles.colProfile}>
                      <div className={styles.personRow}>
                        <div className={styles.avatar} aria-hidden />
                        <div className={styles.personMeta}>
                          <div className={styles.nameLine}>
                            <span className={styles.personName}>{row.person.name}</span>
                            <span className={styles.rankBadge}>{row.person.rank}</span>
                          </div>
                          {row.person.empId ? (
                            <a href="#" className={styles.empIdLink} onClick={(e) => e.preventDefault()}>
                              {row.person.empId}
                              <IconChevronRightLink />
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className={styles.colProject}>
                      <div className={styles.projectWrap}>
                        <div className={styles.projectList}>
                          {row.projects.map((p, idx) => (
                            <div className={styles.projectBox} key={`${p.title}-${p.periodMain}-${idx}`}>
                              <div className={styles.projectRow}>
                                <span className={styles.projectTitle}>{p.title}</span>
                                <span className={badgeClass(p.statusVariant)}>
                                  {p.statusLabel}
                                </span>
                              </div>
                              <div className={styles.projectRow}>
                                <span className={styles.personRole}>{p.role}</span>
                                <span className={styles.personName}>{p.personName}</span>
                              </div>
                              <div className={styles.projectRow}>
                                <span className={styles.projectPeriodMain}>{p.periodMain}</span>
                                <span className={styles.projectPeriodSub}>{p.periodSub}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {row.moreProjectCount > 0 ? (
                          <button type="button" className={styles.buttonMore}>
                            <span>+{row.moreProjectCount}</span>
                            <IconTriangle />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.assignBtn}
            disabled={
              selectedId == null ||
              loading ||
              assigning ||
              sourceRow == null ||
              !roleDemandId ||
              Boolean(fetchError)
            }
            onClick={handleAssign}
          >
            역할 배정
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      {node}
      <AppMessageDialog
        open={messageDialog.open}
        title={messageDialog.title}
        message={messageDialog.message}
        onClose={() => setMessageDialog((prev) => ({ ...prev, open: false }))}
      />
    </>,
    document.body,
  );
}
