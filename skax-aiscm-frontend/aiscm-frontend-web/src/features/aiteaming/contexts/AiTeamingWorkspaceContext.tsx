"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { buildOpportunityCardModelFromSummary } from "@/features/aiteaming/lib/opportunityCardModel";
import { fetchProjectSummaryInBrowser } from "@/features/aiteaming/lib/aiteamingBrowserFetch";
import { aiteamingUserService } from "@/features/aiteaming/services/aiteamingUserService";
import type { AiTeamingOpportunityCardModel } from "@/features/aiteaming/lib/opportunityCardModel";
import type { ProjectSummary } from "@/features/aiteaming/types/project";
import type { ProjectMember } from "@/features/aiteaming/types/projectStaffing";
import type { AiTeamingUserDetail, AiTeamingUserProjectItem } from "@/features/aiteaming/types/userDetail";
import {
  clearWorkspaceTabCookie,
  mirrorWorkspaceTabsToCookie,
  readWorkspaceTabCookieFromDocument,
  type WorkspaceTabCookiePayload,
} from "@/features/aiteaming/lib/workspaceTabCookie";

export type AiTeamingWorkspaceCacheEntry = {
  opportunityCardModel: AiTeamingOpportunityCardModel;
  opportunitySummaryError: string | null;
  /** 투입인력·인건비는 캐시하지 않음 — 상세에서 매번 API 조회 */
  unitBarTitle: string;
};

export function laborFooterFromMembers(members: ProjectMember[]): { totalAmount: string; hint: string } {
  let sum = 0;
  for (const m of members) {
    const v = m.sumLbrcst;
    if (v == null || v === "") continue;
    const n = typeof v === "string" ? Number(String(v).replace(/,/g, "")) : v;
    if (Number.isFinite(n)) sum += n;
  }
  const totalAmount = sum > 0 ? `${Math.round(sum).toLocaleString("ko-KR")}원` : "—";
  return {
    totalAmount,
    hint: "반려된 인력의 인건비를 제외한 합계입니다.",
  };
}

function unitBarTitleFromSummary(summary: ProjectSummary | null, fallbackProjectNo: string): string {
  if (summary?.pjtNm?.trim()) return summary.pjtNm.trim();
  if (summary?.bizOpptyNm?.trim()) return summary.bizOpptyNm.trim();
  return fallbackProjectNo;
}

export function buildWorkspaceCacheEntry(
  projectNo: string,
  summary: ProjectSummary | null,
  summaryError: string | null,
): AiTeamingWorkspaceCacheEntry {
  const opportunityCardModel = buildOpportunityCardModelFromSummary(summary, projectNo);
  return {
    opportunityCardModel,
    opportunitySummaryError: summaryError,
    unitBarTitle: unitBarTitleFromSummary(summary, projectNo),
  };
}

type AiTeamingWorkspaceContextValue = {
  activeProjectNo: string | null;
  tabOrder: string[];
  tabTitles: Record<string, string>;
  cache: Record<string, AiTeamingWorkspaceCacheEntry>;
  userDetail: AiTeamingUserDetail | null;
  projectList: AiTeamingUserProjectItem[];
  workspaceLoading: boolean;
  workspaceError: string | null;
  /** sessionStorage 복원·useLayoutEffect 완료 전에는 false — 탭 레일을 잠시 비우고 깜빡임(1개→N개) 방지 */
  tabsLayoutReady: boolean;
  initializeWorkspace: (usrId: string) => Promise<void>;
  setActiveProject: (projectNo: string) => void;
  /** 브라우저에서 요약·투입인력 API 호출 후 캐시 갱신 */
  prefetchProjectInBrowser: (projectNo: string) => Promise<void>;
  openProjectTab: (projectNo: string) => Promise<void>;
  closeTab: (projectNo: string) => void;
  tabTitleFor: (projectNo: string) => string;
};

const AiTeamingWorkspaceContext = createContext<AiTeamingWorkspaceContextValue | null>(null);

/** 같은 탭에서 새로고침 후에도 탭·본문 캐시 유지(브라우저 탭을 닫으면 삭제). 영구 보존은 localStorage 로 교체. */
const SESSION_STORAGE_KEY = "aiteaming-workspace-v1";

type PersistedWorkspace = {
  tabOrder: string[];
  tabTitles: Record<string, string>;
  cache: Record<string, AiTeamingWorkspaceCacheEntry>;
};

function readPersisted(): PersistedWorkspace | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw == null || raw === "") return null;
    const p = JSON.parse(raw) as PersistedWorkspace;
    if (!Array.isArray(p?.tabOrder)) return null;
    return {
      tabOrder: p.tabOrder,
      tabTitles: typeof p.tabTitles === "object" && p.tabTitles != null ? p.tabTitles : {},
      cache: typeof p.cache === "object" && p.cache != null ? p.cache : {},
    };
  } catch {
    return null;
  }
}

function writePersisted(workspace: PersistedWorkspace): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const raw = JSON.stringify(workspace);
    if (raw.length > 4_000_000) {
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          tabOrder: workspace.tabOrder,
          tabTitles: workspace.tabTitles,
          cache: {},
        } satisfies PersistedWorkspace),
      );
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, raw);
    }
  } catch {
    try {
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          tabOrder: workspace.tabOrder,
          tabTitles: workspace.tabTitles,
          cache: {},
        } satisfies PersistedWorkspace),
      );
    } catch {
      /* ignore */
    }
  }
  mirrorWorkspaceTabsToCookie(workspace.tabOrder, workspace.tabTitles);
}

function clearPersisted(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  clearWorkspaceTabCookie();
}

function tabCookieHint(p: WorkspaceTabCookiePayload | null | undefined): WorkspaceTabCookiePayload | null {
  if (p == null || p.tabOrder.length === 0) return null;
  return p;
}

export function AiTeamingWorkspaceProvider({
  children,
  initialWorkspaceTabs,
}: {
  children: ReactNode;
  /** 정적 export 등에서는 null. sessionStorage 우선 복원, 없으면 document 쿠키 힌트. */
  initialWorkspaceTabs?: WorkspaceTabCookiePayload | null;
}) {
  const tabHint = tabCookieHint(initialWorkspaceTabs ?? null);
  const [activeProjectNo, setActiveProjectNo] = useState<string | null>(() =>
    tabHint?.tabOrder.length ? tabHint.tabOrder[tabHint.tabOrder.length - 1] : null,
  );
  const [tabOrder, setTabOrder] = useState<string[]>(() => tabHint?.tabOrder ?? []);
  const [tabTitles, setTabTitles] = useState<Record<string, string>>(() => tabHint?.tabTitles ?? {});
  const [cache, setCache] = useState<Record<string, AiTeamingWorkspaceCacheEntry>>({});
  const [userDetail, setUserDetail] = useState<AiTeamingUserDetail | null>(null);
  const [projectList, setProjectList] = useState<AiTeamingUserProjectItem[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  /**
   * 쿠키 힌트가 없으면 sessionStorage 복원 전까지 탭 UI 지연(1↔N 깜빡임 방지).
   * 쿠키가 있으면 첫 페인트부터 탭 띠를 그림 — 복원 후에도 useLayoutEffect에서 session으로 정합.
   */
  const [tabsLayoutReady, setTabsLayoutReady] = useState(() => Boolean(tabHint));

  useLayoutEffect(() => {
    const p = readPersisted();
    if (p != null && p.tabOrder.length > 0) {
      setTabOrder(p.tabOrder);
      setTabTitles(p.tabTitles);
      setCache(p.cache);
      setActiveProjectNo(p.tabOrder[p.tabOrder.length - 1] ?? null);
    } else {
      const c = readWorkspaceTabCookieFromDocument();
      if (c != null && c.tabOrder.length > 0) {
        setTabOrder(c.tabOrder);
        setTabTitles(c.tabTitles);
        setActiveProjectNo(c.tabOrder[c.tabOrder.length - 1] ?? null);
      }
    }
    setTabsLayoutReady(true);
  }, []);

  const skipInitialPersistEffect = useRef(true);
  useEffect(() => {
    if (skipInitialPersistEffect.current) {
      skipInitialPersistEffect.current = false;
      return;
    }
    if (tabOrder.length === 0) {
      clearPersisted();
      return;
    }
    writePersisted({ tabOrder, tabTitles, cache });
  }, [tabOrder, tabTitles, cache]);

  const tabOrderRef = useRef<string[]>(tabOrder);
  tabOrderRef.current = tabOrder;

  const prefetchProjectInBrowser = useCallback(async (projectNo: string) => {
    const { summary, error: e1 } = await fetchProjectSummaryInBrowser(projectNo, "summary");
    const entry = buildWorkspaceCacheEntry(projectNo, summary, e1);
    setCache((c) => ({ ...c, [projectNo]: entry }));
    const title =
      entry.opportunityCardModel.opportunityName !== "—"
        ? entry.opportunityCardModel.opportunityName
        : projectNo;
    setTabTitles((t) => ({ ...t, [projectNo]: title }));
  }, []);

  const initializeWorkspace = useCallback(
    async (usrId: string) => {
      if (!usrId.trim()) {
        setWorkspaceLoading(false);
        setWorkspaceError("사용자 식별자가 없습니다.");
        return;
      }
      setWorkspaceLoading(true);
      setWorkspaceError(null);
      try {
        const detail = await aiteamingUserService.getUserDetail(usrId);
        setUserDetail(detail);
        const nextList = detail.pjtlist ?? [];
        setProjectList(nextList);
        setTabTitles((prev) => {
          const next = { ...prev };
          for (const p of nextList) {
            const name = p.pjtNm?.trim();
            if (name && !next[p.pjtNo]) {
              next[p.pjtNo] = name;
            }
          }
          return next;
        });

        const hasTabs = tabOrderRef.current.length > 0;
        if (!hasTabs && nextList.length > 0) {
          const firstProjectNo = nextList[0].pjtNo;
          setTabOrder([firstProjectNo]);
          setActiveProjectNo(firstProjectNo);
          await prefetchProjectInBrowser(firstProjectNo);
        } else if (hasTabs) {
          setActiveProjectNo((prev) => prev ?? tabOrderRef.current[tabOrderRef.current.length - 1] ?? null);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "워크스페이스 초기화에 실패했습니다.";
        setWorkspaceError(message);
      } finally {
        setWorkspaceLoading(false);
      }
    },
    [prefetchProjectInBrowser],
  );

  const setActiveProject = useCallback((projectNo: string) => {
    setActiveProjectNo(projectNo);
  }, []);

  const openProjectTab = useCallback(
    async (projectNo: string) => {
      if (!projectNo) return;
      setActiveProjectNo(projectNo);
      setTabOrder((prev) => (prev.includes(projectNo) ? prev : [...prev, projectNo]));
      if (cache[projectNo] == null) {
        await prefetchProjectInBrowser(projectNo);
      }
    },
    [cache, prefetchProjectInBrowser],
  );

  const closeTab = useCallback(
    (projectNo: string) => {
      if (tabOrderRef.current.length <= 1) return;

      const prev = tabOrderRef.current;
      const next = prev.filter((p) => p !== projectNo);

      setTabOrder(next);
      setTabTitles((t) => {
        const titles = { ...t };
        delete titles[projectNo];
        return titles;
      });
      setCache((c) => {
        const nextCache = { ...c };
        delete nextCache[projectNo];
        return nextCache;
      });

      if (projectNo === activeProjectNo) {
        setActiveProjectNo(next[next.length - 1] ?? null);
      }
    },
    [activeProjectNo],
  );

  const tabTitleFor = useCallback(
    (projectNo: string) => {
      const titleFromTabs = tabTitles[projectNo]?.trim();
      if (titleFromTabs) return titleFromTabs;

      const titleFromCache = cache[projectNo]?.opportunityCardModel.opportunityName?.trim();
      if (titleFromCache && titleFromCache !== "—") return titleFromCache;

      const titleFromProjectList = projectList.find((p) => p.pjtNo === projectNo)?.pjtNm?.trim();
      if (titleFromProjectList) return titleFromProjectList;

      return "프로젝트명 조회 중...";
    },
    [tabTitles, cache, projectList],
  );

  const value = useMemo(
    () => ({
      activeProjectNo,
      tabOrder,
      tabTitles,
      cache,
      userDetail,
      projectList,
      workspaceLoading,
      workspaceError,
      tabsLayoutReady,
      initializeWorkspace,
      setActiveProject,
      prefetchProjectInBrowser,
      openProjectTab,
      closeTab,
      tabTitleFor,
    }),
    [
      activeProjectNo,
      tabOrder,
      tabTitles,
      cache,
      userDetail,
      projectList,
      workspaceLoading,
      workspaceError,
      tabsLayoutReady,
      initializeWorkspace,
      setActiveProject,
      prefetchProjectInBrowser,
      openProjectTab,
      closeTab,
      tabTitleFor,
    ],
  );

  return <AiTeamingWorkspaceContext.Provider value={value}>{children}</AiTeamingWorkspaceContext.Provider>;
}

export function useAiTeamingWorkspace(): AiTeamingWorkspaceContextValue {
  const v = useContext(AiTeamingWorkspaceContext);
  if (v == null) {
    throw new Error("useAiTeamingWorkspace must be used within AiTeamingWorkspaceProvider");
  }
  return v;
}

/** 레이아웃 밖(테스트 등)에서 선택적 사용 */
export function useAiTeamingWorkspaceOptional(): AiTeamingWorkspaceContextValue | null {
  return useContext(AiTeamingWorkspaceContext);
}
