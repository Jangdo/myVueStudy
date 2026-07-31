"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AiTeamingOpportunityCardModel } from "@/features/aiteaming/lib/opportunityCardModel";
import type { ProjectSummary } from "@/features/aiteaming/types/project";
import type { ProjectMember } from "@/features/aiteaming/types/projectStaffing";
import { laborFooterFromMembers, useAiTeamingWorkspace } from "@/features/aiteaming/contexts/AiTeamingWorkspaceContext";
import { fetchProjectStaffingInBrowser } from "@/features/aiteaming/lib/aiteamingBrowserFetch";
import {
  laborTotalLabelFromStaffingMembers,
  mapProjectMemberToStaffingMember,
  type AiTeamingStaffingMember,
} from "./team/teamMembersFromApi";
import { AiTeamingAppShell } from "../layout/AiTeamingAppShell";
import { AiTeamingDocTabBar } from "./doc-tab/AiTeamingDocTabBar";
import { AiTeamingLaborCostFooter } from "./labor-cost/AiTeamingLaborCostFooter";
import { AiTeamingOpportunityCard } from "./opportunity/AiTeamingOpportunityCard";
import { AiTeamingTeamMembersSection } from "./team/AiTeamingTeamMembersSection";
import { AiTeamingUnitProjectBar } from "./unit-project/AiTeamingUnitProjectBar";
import { parseScmLnbType } from "../lnb/scmLnb.types";
import styles from "./AiTeamingProjectDetailPage.module.css";

export interface AiTeamingProjectDetailPageProps {
  projectCode: string;
  opportunityCardModel: AiTeamingOpportunityCardModel;
  opportunitySummaryError: string | null;
  docTabTitle?: string | null;
  staffingMembers: AiTeamingStaffingMember[];
  staffingError: string | null;
  /** RSC 초깃값·`skipClientDataFetch` 시에만 사용. 일반 클라이언트는 투입인력 API로 매번 갱신 */
  initialSummary: ProjectSummary | null;
  initialMembers: ProjectMember[] | null;
  /** true면 브라우저 API(prefetch)를 호출하지 않음 — `/pub/` 목업 등 */
  skipClientDataFetch?: boolean;
}

export function AiTeamingProjectDetailPage({
  projectCode,
  opportunityCardModel,
  opportunitySummaryError,
  docTabTitle,
  staffingMembers,
  staffingError,
  initialSummary,
  initialMembers,
  skipClientDataFetch = false,
}: AiTeamingProjectDetailPageProps) {
  void initialSummary;
  void initialMembers;
  const searchParams = useSearchParams();
  const { activeProjectNo, cache, tabOrder, tabsLayoutReady, setActiveProject, prefetchProjectInBrowser, closeTab, tabTitleFor } =
    useAiTeamingWorkspace();

  const scmLnbType = useMemo(
    () => parseScmLnbType(searchParams.get("phase") ?? undefined, "영업"),
    [searchParams],
  );

  const resolvedProjectCode = activeProjectNo ?? projectCode;

  const [staffingReloadKey, setStaffingReloadKey] = useState(0);
  const [staffingRefreshing, setStaffingRefreshing] = useState(false);
  /** 클라이언트 투입인력 조회 중(첫 로드·탭 전환 등). 빈 목록으로 빈 문구가 잠깐 보이는 현상 방지 */
  const [staffingListLoading, setStaffingListLoading] = useState(
    () => !skipClientDataFetch && staffingMembers.length === 0,
  );
  const [staffSnapshot, setStaffSnapshot] = useState<{
    snapshotProjectNo: string;
    rows: AiTeamingStaffingMember[];
    error: string | null;
    labor: { totalAmount: string; hint: string };
  } | null>(null);
  const staffingFetchProjectRef = useRef<string | null>(null);

  useEffect(() => {
    if (skipClientDataFetch || !resolvedProjectCode) {
      staffingFetchProjectRef.current = null;
      setStaffSnapshot(null);
      setStaffingRefreshing(false);
      setStaffingListLoading(false);
      return;
    }

    const projectChanged = staffingFetchProjectRef.current !== resolvedProjectCode;
    staffingFetchProjectRef.current = resolvedProjectCode;

    if (projectChanged) {
      setStaffSnapshot(null);
      setStaffingRefreshing(false);
    }

    const showRefreshIndicator = !projectChanged && staffingReloadKey > 0;
    if (showRefreshIndicator) {
      setStaffingRefreshing(true);
    }

    setStaffingListLoading(true);

    let cancelled = false;
    void (async () => {
      try {
        const { members, error } = await fetchProjectStaffingInBrowser(resolvedProjectCode);
        if (cancelled) return;
        const list = members ?? [];
        const rows = list.map((m, i) => mapProjectMemberToStaffingMember(m, i));
        const labor = laborFooterFromMembers(list);
        setStaffSnapshot({ snapshotProjectNo: resolvedProjectCode, rows, error, labor });
      } finally {
        if (!cancelled) {
          setStaffingListLoading(false);
          if (showRefreshIndicator) {
            setStaffingRefreshing(false);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedProjectCode, skipClientDataFetch, staffingReloadKey]);

  const refreshProjectStaffing = useCallback(() => {
    if (skipClientDataFetch || !resolvedProjectCode) {
      return;
    }
    setStaffingReloadKey((k) => k + 1);
  }, [skipClientDataFetch, resolvedProjectCode]);

  useEffect(() => {
    if (skipClientDataFetch) return;
    if (!resolvedProjectCode) return;
    if (cache[resolvedProjectCode] != null) return;
    void prefetchProjectInBrowser(resolvedProjectCode);
  }, [resolvedProjectCode, skipClientDataFetch, cache, prefetchProjectInBrowser]);

  const entry = resolvedProjectCode ? cache[resolvedProjectCode] : undefined;
  const cardModel = entry?.opportunityCardModel ?? opportunityCardModel;
  const summaryErr = entry?.opportunitySummaryError ?? opportunitySummaryError;
  const rows = useMemo(() => {
    if (staffSnapshot == null) return staffingMembers;
    if (staffSnapshot.snapshotProjectNo !== resolvedProjectCode) return staffingMembers;
    return staffSnapshot.rows;
  }, [staffSnapshot, staffingMembers, resolvedProjectCode]);

  const staffErr = useMemo(() => {
    if (staffSnapshot == null) return staffingError;
    if (staffSnapshot.snapshotProjectNo !== resolvedProjectCode) return staffingError;
    return staffSnapshot.error;
  }, [staffSnapshot, staffingError, resolvedProjectCode]);

  const unitTitle = entry?.unitBarTitle ?? (docTabTitle && docTabTitle !== "—" ? docTabTitle : "담당 팀원");
  /** 표시 중인 행과 동일 소스로 합계 → 스냅샷/폴백 전환 시 푸터만 따로 튀지 않게 함 */
  const laborDisplay = useMemo(() => laborTotalLabelFromStaffingMembers(rows), [rows]);

  /** 현재 탭 프로젝트에 대한 투입인력 스냅샷이 이미 받아진 상태 */
  const staffingReadyForActiveProject = useMemo(
    () =>
      skipClientDataFetch ||
      (staffSnapshot != null && staffSnapshot.snapshotProjectNo === resolvedProjectCode),
    [skipClientDataFetch, staffSnapshot, resolvedProjectCode],
  );

  /** 스냅샷 없음·탭 불일치 등으로 아직 표시할 행이 없을 때 스켈레톤 유지 (snapshotStale 포함) */
  const staffingAwaitingFetch = useMemo(
    () => !skipClientDataFetch && rows.length === 0 && !staffingReadyForActiveProject,
    [skipClientDataFetch, rows.length, staffingReadyForActiveProject],
  );

  /** 빈 목록이 확정되기 전까지 푸터 숨김 — 같은 프로젝트 재조회(rows 유지) 시에는 표시 */
  const deferLaborFooter = useMemo(
    () =>
      !skipClientDataFetch &&
      rows.length === 0 &&
      (!staffingReadyForActiveProject || staffingListLoading),
    [skipClientDataFetch, rows.length, staffingReadyForActiveProject, staffingListLoading],
  );

  const orderedTabs = tabsLayoutReady ? tabOrder : null;

  return (
    <div className={styles.viewportFill}>
      <AiTeamingAppShell activeProjectCode={resolvedProjectCode} scmLnbType={scmLnbType}>
        <div className={styles.root}>
          <div className={styles.tabRail} suppressHydrationWarning>
          {orderedTabs == null ? (
            <div className={styles.tabRailPlaceholder} aria-hidden />
          ) : orderedTabs.length === 0 ? (
            <div className={styles.tabRailEmpty}>좌측 프로젝트 목록에서 프로젝트를 선택해 주세요.</div>
          ) : (
            orderedTabs.map((pid) => (
              <AiTeamingDocTabBar
                key={pid}
                tabTitle={tabTitleFor(pid)}
                isActive={pid === resolvedProjectCode}
                closable={orderedTabs.length > 1}
                onSelect={() => setActiveProject(pid)}
                onClose={() => closeTab(pid)}
              />
            ))
          )}
          </div>
          <div className={styles.bodyPanel}>
          {resolvedProjectCode == null ? (
            <div className={styles.emptyPanel}>프로젝트를 선택하면 상세 정보가 표시됩니다.</div>
          ) : (
            <div className={styles.stack}>
            <AiTeamingOpportunityCard model={cardModel} summaryError={summaryErr} />
            <div className={styles.dividerGap}>
              <AiTeamingUnitProjectBar title={unitTitle} />
            </div>
            <div className={styles.card}>
              <AiTeamingTeamMembersSection
                projectCode={resolvedProjectCode}
                staffingMembers={rows}
                staffingError={staffErr}
                staffingRefreshing={staffingRefreshing}
                staffingListLoading={staffingAwaitingFetch}
                onStaffingRefresh={refreshProjectStaffing}
              />
              {!deferLaborFooter ? (
                <AiTeamingLaborCostFooter totalAmount={laborDisplay.totalAmount} hint={laborDisplay.hint} />
              ) : null}
            </div>
            </div>
          )}
          </div>
        </div>
      </AiTeamingAppShell>
    </div>
  );
}
