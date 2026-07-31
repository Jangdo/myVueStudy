"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import styles from "./AiTeamingTeamMembersSection.module.css";
import { AppConfirmDialog, AppMessageDialog } from "@/shared/ui/AppDialog";
import { useAiTeamingWorkspace } from "@/features/aiteaming/contexts/AiTeamingWorkspaceContext";
import { aiteamingAssignmentService } from "@/features/aiteaming/services/aiteamingAssignmentService";
import { aiteamingCommonService } from "@/features/aiteaming/services/aiteamingCommonService";
import { aiteamingProjectService } from "@/features/aiteaming/services/aiteamingProjectService";
import type { CommonCodeItem } from "@/features/aiteaming/types/common";
import { TeamMemberAiRecommendModal } from "./TeamMemberAiRecommendModal";
import { TeamMemberRoleEditModal } from "./TeamMemberRoleEditModal";
import { TeamMemberRoleEditNoticeModal } from "./TeamMemberRoleEditNoticeModal";
import { TeamMemberSearchModal } from "./TeamMemberSearchModal";
import {
  TEAM_MEMBER_TABS,
  applyRecommendSelectionToStaffingMember,
  type AiTeamingStaffingMember,
  type TeamMemberTab,
  staffingMemberMatchesTab,
} from "./teamMembersFromApi";

type BadgeVariant = "green" | "gray" | "blue" | "orange" | "red" | "teal";

/** 미배정 행: 인력지정(AI/검색) vs 등급지정(TBD+등급) */
type TbdPersonSubMode = "assignPerson" | "assignGrade";

const TABS = TEAM_MEMBER_TABS;
const STAFFING_SKELETON_ROWS = 6;

/** 공통코드 로드 실패 시 등급 셀렉트 폴백 */
const FALLBACK_PLVL_OPTIONS: { value: string; label: string }[] = [
  { value: "P1", label: "P1" },
  { value: "P2", label: "P2" },
  { value: "P3", label: "P3" },
];

function mergePlvlSelectOptions(
  base: { value: string; label: string }[],
  currentCd: string | null | undefined,
  currentNm: string | null | undefined,
): { value: string; label: string }[] {
  const cd = currentCd?.trim();
  if (!cd || base.some((o) => o.value === cd)) return base;
  return [...base, { value: cd, label: (currentNm ?? cd).trim() }];
}

function StaffingTableSkeletonBody() {
  return (
    <>
      {Array.from({ length: STAFFING_SKELETON_ROWS }, (_, i) => (
        <tr key={`staff-sk-${i}`} className={styles.skeletonRow} aria-hidden>
          <td className={styles.tdCheckbox}>
            <div className={`${styles.skeletonBar} ${styles.skeletonCheckbox}`} />
          </td>
          <td className={styles.tdRole}>
            <div className={styles.skeletonBar} style={{ width: "72%", margin: "0 auto" }} />
          </td>
          <td className={styles.tdJob}>
            <div className={styles.skeletonBar} style={{ width: "80%", margin: "0 auto" }} />
          </td>
          <td className={styles.tdSkill}>
            <div className={styles.skeletonBar} style={{ width: "70%", margin: "0 auto" }} />
          </td>
          <td className={styles.tdPerson}>
            <div
              className={`${styles.skeletonBar} ${styles.skeletonBarPerson}`}
              style={{ width: "88%", margin: "0 auto" }}
            />
          </td>
          <td className={styles.tdPeriod}>
            <div className={styles.skeletonBar} style={{ width: "75%", margin: "0 auto" }} />
          </td>
          <td className={styles.tdAmount}>
            <div className={styles.skeletonBar} style={{ width: "55%", margin: "0 auto" }} />
          </td>
          <td className={styles.tdAction}>
            <div className={styles.skeletonBar} style={{ width: 36, margin: "0 auto" }} />
          </td>
        </tr>
      ))}
    </>
  );
}

function badgeClass(v: BadgeVariant): string {
  switch (v) {
    case "green":
      return `${styles.badge} ${styles.badgeGreen}`;
    case "gray":
      return `${styles.badge} ${styles.badgeGray}`;
    case "blue":
      return `${styles.badge} ${styles.badgeBlue}`;
    case "orange":
      return `${styles.badge} ${styles.badgeOrange}`;
    case "red":
      return `${styles.badge} ${styles.badgeRed}`;
    case "teal":
      return `${styles.badge} ${styles.badgeTeal}`;
    default:
      return styles.badge;
  }
}

export interface AiTeamingTeamMembersSectionProps {
  /** `AiTeamingProjectDetailPage`의 `projectCode` (= API `pjtNo`) */
  projectCode: string;
  /** 서버 `members/assign` → `mapProjectMemberToStaffingMember` 로 변환한 목록 */
  staffingMembers: AiTeamingStaffingMember[];
  /** 투입인력 API 실패 시 안내 (브라우저에서 API 호출 없음) */
  staffingError?: string | null;
  /** 같은 프로젝트에서 투입인력 재조회 중 (표 유지 + 로딩 표시) */
  staffingRefreshing?: boolean;
  /** 첫 조회·프로젝트 탭 전환 등 목록 로딩 중 (빈 문구 깜빡임 대신 스켈레톤) */
  staffingListLoading?: boolean;
  /** 배정 등 성공 후 투입인력·요약 캐시를 다시 받아올 때 (워크스페이스 `prefetchProjectInBrowser` 등) */
  onStaffingRefresh?: () => void | Promise<void>;
}

function IconMinusRow() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
      <path d="M1 4h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
      <path d="M4 1v6M1 4h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconAiChart() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path
        d="M1 8V2M2.5 8V5M4 8V3.5M5.5 8V4.5M7 8V2.5M8.5 8V6"
        stroke="#2d55f4"
        strokeWidth="1"
        strokeLinecap="round"
      />
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

function IconAiSparkle() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className={styles.aiBtnIcon}>
      <path
        d="M6 0l.9 3.1L10 4l-3.1.9L6 8l-.9-3.1L2 4l3.1-.9L6 0ZM3.5 9l.4 1.3 1.3.4-1.3.4L3.5 12l-.4-1.3-1.3-.4 1.3-.4.4-1.3Z"
        fill="currentColor"
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

export function AiTeamingTeamMembersSection({
  projectCode,
  staffingMembers,
  staffingError,
  staffingRefreshing = false,
  staffingListLoading = false,
  onStaffingRefresh,
}: AiTeamingTeamMembersSectionProps) {
  const { prefetchProjectInBrowser } = useAiTeamingWorkspace();
  const [activeTab, setActiveTab] = useState<TeamMemberTab>("전체");
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchAssignRole, setSearchAssignRole] = useState("");
  const [searchPjtRoleDmndId, setSearchPjtRoleDmndId] = useState("");
  const [searchSourceRow, setSearchSourceRow] = useState<AiTeamingStaffingMember | null>(null);
  const [aiRecommendOpen, setAiRecommendOpen] = useState(false);
  const [aiRecommendAssignRole, setAiRecommendAssignRole] = useState("");
  const [aiRecommendPjtRoleDmndId, setAiRecommendPjtRoleDmndId] = useState("");
  const [aiRecommendSourceRow, setAiRecommendSourceRow] = useState<AiTeamingStaffingMember | null>(null);
  const [localStaffingMembers, setLocalStaffingMembers] = useState<AiTeamingStaffingMember[]>(staffingMembers);
  const [roleEditNoticeOpen, setRoleEditNoticeOpen] = useState(false);
  const [roleEditModalOpen, setRoleEditModalOpen] = useState(false);
  const [editTargetRoleDmndId, setEditTargetRoleDmndId] = useState<string | null>(null);
  /** 배정 인력 없는 행마다 서브 탭(기본: 인력지정) */
  const [tbdSubModeByRowId, setTbdSubModeByRowId] = useState<Record<string, TbdPersonSubMode>>({});
  /** 배정취소용 — `AiTeamingStaffingMember.id` (선정 PK가 있는 행만 토글 가능) */
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [alertDialog, setAlertDialog] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const [cancelConfirm, setCancelConfirm] = useState<{ open: boolean; count: number; ids: number[] }>({
    open: false,
    count: 0,
    ids: [],
  });
  const [plvlOptions, setPlvlOptions] = useState<{ value: string; label: string }[]>(() => FALLBACK_PLVL_OPTIONS);
  const [savingPlvlForDmndId, setSavingPlvlForDmndId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items: CommonCodeItem[] = await aiteamingCommonService.postGrpCodes(["plvl_tp_cd"]);
        if (cancelled) return;
        const opts = items
          .filter((c) => c.cmmGrpCd === "plvl_tp_cd" && c.useYn !== false)
          .map((c) => ({ value: c.cmmCdVal, label: (c.cmmCdNm || c.cmmCdVal).trim() }));
        setPlvlOptions(opts.length > 0 ? opts : FALLBACK_PLVL_OPTIONS);
      } catch {
        if (!cancelled) setPlvlOptions(FALLBACK_PLVL_OPTIONS);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    setLocalStaffingMembers(staffingMembers);
  }, [staffingMembers]);

  useLayoutEffect(() => {
    setSelectedRowIds([]);
  }, [projectCode]);

  const visibleRows = useMemo(
    () => localStaffingMembers.filter((row) => staffingMemberMatchesTab(activeTab, row)),
    [localStaffingMembers, activeTab],
  );

  const visibleSelectableRows = useMemo(
    () => visibleRows.filter((row) => row.prplMpSelctId != null && Number.isFinite(Number(row.prplMpSelctId))),
    [visibleRows],
  );

  const selectedIdSet = useMemo(() => new Set(selectedRowIds), [selectedRowIds]);

  const allVisibleSelectableChecked =
    visibleSelectableRows.length > 0 && visibleSelectableRows.every((r) => selectedIdSet.has(r.id));

  const toggleRowSelected = useCallback((rowId: string, checked: boolean) => {
    setSelectedRowIds((prev) => {
      const s = new Set(prev);
      if (checked) s.add(rowId);
      else s.delete(rowId);
      return Array.from(s);
    });
  }, []);

  const toggleSelectAllVisible = useCallback(() => {
    const ids = visibleSelectableRows.map((r) => r.id);
    if (ids.length === 0) return;
    setSelectedRowIds((prev) => {
      const prevSet = new Set(prev);
      const allOn = ids.every((id) => prevSet.has(id));
      if (allOn) {
        const next = new Set(prevSet);
        ids.forEach((id) => next.delete(id));
        return Array.from(next);
      }
      return Array.from(new Set([...prev, ...ids]));
    });
  }, [visibleSelectableRows]);

  const handleTbdPlvlChange = useCallback(
    async (row: AiTeamingStaffingMember, nextPlvl: string) => {
      const rid = row.pjtRoleDmndId?.trim();
      if (!rid || !nextPlvl) return;
      setSavingPlvlForDmndId(rid);
      try {
        await aiteamingProjectService.patchRoleDemandPlvl(projectCode, rid, nextPlvl);
        const label =
          plvlOptions.find((o) => o.value === nextPlvl)?.label ??
          FALLBACK_PLVL_OPTIONS.find((o) => o.value === nextPlvl)?.label ??
          nextPlvl;
        setLocalStaffingMembers((prev) =>
          prev.map((m) =>
            m.pjtRoleDmndId?.trim() === rid
              ? { ...m, plvlTpCd: nextPlvl, plvlTpNm: label }
              : m,
          ),
        );
        await prefetchProjectInBrowser(projectCode);
        await onStaffingRefresh?.();
      } catch (e: unknown) {
        setAlertDialog({
          open: true,
          message: e instanceof Error ? e.message : "P등급 변경에 실패했습니다.",
        });
      } finally {
        setSavingPlvlForDmndId(null);
      }
    },
    [projectCode, plvlOptions, prefetchProjectInBrowser, onStaffingRefresh],
  );

  const runAssignmentDelete = useCallback(
    async (prplMpSelctIds: number[]) => {
      if (prplMpSelctIds.length === 0) return;
      try {
        await aiteamingAssignmentService.postSelectionsDelete({
          pjtNo: projectCode,
          prplMpSelctIds,
        });
        setSelectedRowIds([]);
        await prefetchProjectInBrowser(projectCode);
        await onStaffingRefresh?.();
      } catch (e: unknown) {
        setAlertDialog({
          open: true,
          message: e instanceof Error ? e.message : "배정 취소에 실패했습니다.",
        });
      }
    },
    [projectCode, prefetchProjectInBrowser, onStaffingRefresh],
  );

  const handleBulkCancelAssignments = useCallback(() => {
    const targets = localStaffingMembers.filter(
      (r) => selectedIdSet.has(r.id) && r.prplMpSelctId != null && Number.isFinite(Number(r.prplMpSelctId)),
    );
    const prplMpSelctIds = targets.map((r) => Number(r.prplMpSelctId));
    if (prplMpSelctIds.length === 0) {
      setAlertDialog({
        open: true,
        message: "배정 취소할 행을 선택해 주세요. (선정된 인력만 선택 가능)",
      });
      return;
    }
    setCancelConfirm({ open: true, count: prplMpSelctIds.length, ids: prplMpSelctIds });
  }, [localStaffingMembers, selectedIdSet]);

  /** 부모의 staffingAwaitingFetch( prop명 staffingListLoading ): 현재 프로젝트 스냅샷 전·탭 불일치 시에도 스켈레톤 */
  const showStaffingSkeleton =
    staffingListLoading && !staffingError && staffingMembers.length === 0;

  /** 로딩·대기 중에는 빈 행 문구 숨김 (staffingListLoading prop = 부모의 staffingAwaitingFetch) */
  const showEmptyRowMessage =
    !staffingListLoading && visibleRows.length === 0;

  return (
    <section className={styles.root}>
      {staffingError ? (
        <p className={styles.staffingFetchError} role="status">
          {staffingError}
        </p>
      ) : null}

      <div className={styles.tabs} role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={activeTab === t}
            className={`${styles.tab} ${activeTab === t ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarPrefix}>
          <div className={styles.iconBtnGroup}>
            <button type="button" className={styles.iconBtn} aria-label="행 삭제">
              <IconMinusRow />
            </button>
            <button type="button" className={styles.iconBtn} aria-label="추가">
              <IconPlus />
            </button>
            <button
              type="button"
              className={`${styles.editBtn} ${styles.iconBtnFav}`}
              aria-label="선택한 인력 배정 취소"
              onClick={() => void handleBulkCancelAssignments()}
            >
              배정취소
            </button>
          </div>
        </div>
        <div className={styles.toolbarSuffix}>
          <button type="button" className={styles.btnGhost}>
            <IconAiChart />
            AI 추천 조건 설정
          </button>
          {/* <button type="button" className={styles.btnPrimary}>
            승인요청
          </button> */}
        </div>
      </div>

      {showStaffingSkeleton ? (
        <p className={styles.visuallyHidden} role="status" aria-live="polite">
          투입인력을 불러오는 중입니다.
        </p>
      ) : null}

      <div
        className={`${styles.tableWrap} ${staffingRefreshing ? styles.tableWrapRefreshing : ""}`}
        aria-busy={staffingRefreshing || staffingListLoading || undefined}
      >
        <table className={styles.table}>
          <colgroup>
            <col className={styles.colSelect} />
            <col className={styles.colRole} />
            <col className={styles.colJop} />
            <col className={styles.colSkill} />
            <col className={styles.colPerson} />
            <col className={styles.colPeriod} />
            <col className={styles.colAmount} />
            <col className={styles.colAction} />
          </colgroup>
          <thead>
            <tr>
              <th className={styles.thCheckbox} scope="col">
                <input
                  className={styles.tableCheckbox}
                  type="checkbox"
                  aria-label="현재 탭에서 선정된 행 전체 선택"
                  checked={allVisibleSelectableChecked}
                  disabled={visibleSelectableRows.length === 0}
                  onChange={() => toggleSelectAllVisible()}
                />
              </th>
              <th className={`${styles.thRole}`} scope="col">
                역할
              </th>
              <th className={`${styles.thStatus}`} scope="col">
                직무
              </th>
              <th scope="col">
                필요 스킬셋
              </th>
              <th className={`${styles.thPerson}`} scope="col">
                배정 인력
              </th>
              {/* <th scope="col">
                직무역량
              </th> */}
              <th scope="col">
                투입기간
              </th>
              <th className={`${styles.thAmount}`} scope="col">
                금액(원)
              </th>
              <th className={styles.thAction} scope="col">
                <span className={styles.visuallyHidden}>작업</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {showStaffingSkeleton ? (
              <StaffingTableSkeletonBody />
            ) : showEmptyRowMessage ? (
              <tr>
                <td className={styles.tdEmpty} colSpan={8}>
                  {localStaffingMembers.length === 0
                    ? "등록된 투입인력이 없습니다."
                    : "이 탭에 해당하는 인력이 없습니다."}
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => {
                const tbdSubMode = tbdSubModeByRowId[row.id] ?? "assignPerson";
                return (
              <tr key={row.id}>
                <td className={styles.tdCheckbox}>
                  <input
                    className={styles.tableCheckbox}
                    type="checkbox"
                    aria-label={`${row.role} 선택`}
                    checked={selectedIdSet.has(row.id)}
                    disabled={row.prplMpSelctId == null || !Number.isFinite(Number(row.prplMpSelctId))}
                    onChange={(e) => toggleRowSelected(row.id, e.target.checked)}
                  />
                </td>
                <td className={styles.tdRole}>
                  <div className={styles.role}>
                    {row.role}
                  </div>
                  <span className={badgeClass(row.status.variant)}>
                    {row.status.label}
                    {row.status.alert ? <IconAlertCircle /> : null}
                  </span>
                </td>
                <td className={styles.tdJob}>
                  <span className={styles.job}>{row.skill.jobLine}</span>
                </td>
                <td className={styles.tdSkill}>
                  <span className={styles.skill}>
                    {row.skill.skillLabels.length > 0
                      ? row.skill.skillLabels.join(", ")
                      : "—"}
                  </span>
                </td>
                <td className={styles.tdPerson}>
                  {row.person ? (
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
                        {/* <span className={styles.teamSub}>{row.person.team}</span> */}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.personActions}>
                      <div className={styles.personActionsRow}>
                        <div className={styles.switch}>
                          <button
                            type="button"
                            className={tbdSubMode === "assignPerson" ? styles.active : ""}
                            onClick={() =>
                              setTbdSubModeByRowId((prev) => ({ ...prev, [row.id]: "assignPerson" }))
                            }
                          >
                            인력지정
                          </button>
                          <button
                            type="button"
                            className={tbdSubMode === "assignGrade" ? styles.active : ""}
                            onClick={() =>
                              setTbdSubModeByRowId((prev) => ({ ...prev, [row.id]: "assignGrade" }))
                            }
                          >
                            등급지정
                          </button>
                        </div>
                      </div>
                      {tbdSubMode === "assignPerson" ? (
                      <div className={styles.personActionsRow}>
                        <div className={styles.personButtonBox}>
                          <button
                            type="button"
                            className={styles.aiBtn}
                            onClick={() => {
                              const rid = row.pjtRoleDmndId?.trim();
                              if (!rid) {
                                setAlertDialog({
                                  open: true,
                                  message: "역할 수요 ID(pjtRoleDmndId)가 없어 AI 추천을 요청할 수 없습니다.",
                                });
                                return;
                              }
                              setAiRecommendAssignRole(row.role);
                              setAiRecommendPjtRoleDmndId(rid);
                              setAiRecommendSourceRow(row);
                              setAiRecommendOpen(true);
                            }}
                          >
                            <IconAiSparkle />
                            AI 추천받기
                          </button>
                          <button
                            type="button"
                            className={styles.searchBtn}
                            onClick={() => {
                              const rid = row.pjtRoleDmndId?.trim();
                              if (!rid) {
                                setAlertDialog({
                                  open: true,
                                  message:
                                    "역할 수요 ID(pjtRoleDmndId)가 없어 직접 검색으로 배정할 수 없습니다.",
                                });
                                return;
                              }
                              setSearchAssignRole(row.role);
                              setSearchPjtRoleDmndId(rid);
                              setSearchSourceRow(row);
                              setSearchModalOpen(true);
                            }}
                          >
                            직접검색
                          </button>
                        </div>
                      </div>
                      ) : (
                      <div className={styles.personActionsRow}>
                        <div className={styles.personTbd}>
                          <div className={styles.avatar} aria-hidden />
                          <span className={styles.tbd}>TBD</span>
                          <select
                            className={styles.select}
                            aria-label={`${row.role} 등급`}
                            value={row.plvlTpCd ?? ""}
                            disabled={savingPlvlForDmndId === row.pjtRoleDmndId?.trim()}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v) void handleTbdPlvlChange(row, v);
                            }}
                          >
                            <option value="">등급 선택</option>
                            {mergePlvlSelectOptions(plvlOptions, row.plvlTpCd, row.plvlTpNm).map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      )}
                    </div>
                  )}
                </td>
                {/* <td className={styles.tdCompetency}>
                  <ul className={styles.competency}>
                    {row.competency.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </td> */}
                <td className={styles.tdPeriod}>
                  <div className={styles.periodMain}>{row.period.main}</div>
                  <div className={styles.periodSub}>{row.period.sub}</div>
                </td>
                <td className={styles.tdAmount}>
                  <div className={styles.amountStack}>
                    <div className={styles.amountMain}>{row.amount.main}</div>
                    <div className={styles.amountSub}>{row.amount.sub}</div>
                  </div>
                </td>
                <td className={styles.tdAction}>
                  <button
                    type="button"
                    className={styles.editBtn}
                    onClick={() => {
                      const rid = row.pjtRoleDmndId?.trim() ?? "";
                      if (!rid) {
                        setAlertDialog({
                          open: true,
                          message: "역할 수요 ID(pjtRoleDmndId)가 없어 역할을 수정할 수 없습니다.",
                        });
                        return;
                      }
                      setEditTargetRoleDmndId(rid);
                      setRoleEditNoticeOpen(true);
                    }}
                  >
                    수정
                  </button>
                </td>
              </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TeamMemberSearchModal
        open={searchModalOpen}
        onClose={() => {
          setSearchModalOpen(false);
          setSearchSourceRow(null);
        }}
        assignRole={searchAssignRole}
        pjtRoleDmndId={searchPjtRoleDmndId}
        sourceRow={searchSourceRow}
        onAssigned={async (selected, source) => {
          setLocalStaffingMembers((prev) =>
            prev.map((r) => (r.id === source.id ? applyRecommendSelectionToStaffingMember(r, selected) : r)),
          );
          await onStaffingRefresh?.();
        }}
      />
      <TeamMemberAiRecommendModal
        open={aiRecommendOpen}
        onClose={() => {
          setAiRecommendOpen(false);
          setAiRecommendSourceRow(null);
        }}
        projectCode={projectCode}
        assignRole={aiRecommendAssignRole}
        pjtRoleDmndId={aiRecommendPjtRoleDmndId}
        sourceRow={aiRecommendSourceRow}
        onAssigned={async (selected, source) => {
          setLocalStaffingMembers((prev) =>
            prev.map((r) => (r.id === source.id ? applyRecommendSelectionToStaffingMember(r, selected) : r)),
          );
          await onStaffingRefresh?.();
        }}
      />
      <TeamMemberRoleEditNoticeModal
        open={roleEditNoticeOpen}
        onClose={() => setRoleEditNoticeOpen(false)}
        onConfirm={() => setRoleEditModalOpen(true)}
      />
      <TeamMemberRoleEditModal
        projectCode={projectCode}
        pjtRoleDmndId={editTargetRoleDmndId}
        open={roleEditModalOpen}
        onClose={() => setRoleEditModalOpen(false)}
        onSaved={async () => {
          await prefetchProjectInBrowser(projectCode);
          await onStaffingRefresh?.();
        }}
      />
      <AppMessageDialog
        open={alertDialog.open}
        message={alertDialog.message}
        onClose={() => setAlertDialog({ open: false, message: "" })}
      />
      <AppConfirmDialog
        open={cancelConfirm.open}
        title="배정 취소"
        message={`선정된 ${cancelConfirm.count}명의 인력을 삭제하시겠습니까?`}
        cancelLabel="아니오"
        confirmLabel="삭제"
        confirmVariant="danger"
        onCancel={() => setCancelConfirm({ open: false, count: 0, ids: [] })}
        onConfirm={() => {
          const ids = [...cancelConfirm.ids];
          setCancelConfirm({ open: false, count: 0, ids: [] });
          void runAssignmentDelete(ids);
        }}
      />
    </section>
  );
}
