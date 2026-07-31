import type { ProtoShellNavId } from "@/features/proto/lib/protoNavVisibility";

/** prototype App.tsx PAGE_TITLE / PAGE_BREADCRUMB 정합 + Next 전용(landing, projects, stats) */
const PAGE_TITLE: Record<string, string> = {
  overview: "요약보드 – Pipeline 단계별 사업 현황",
  employees: "직원 보관함",
  notifications: "알림센터",
  "pm-matching": "PM 배정 관리",
  "team-matching": "팀원 배정",
  scoping: "프로젝트 범위 정의",
  "team-mgmt": "프로젝트 팀 배정 관리",
  "matching-logs": "배정 이력",
  inbox: "배정 승인 관리",
  playground: "UI 샘플",
  external: "외부 연동",
  projects: "프로젝트 목록",
  stats: "팀 통계",
  landing: "Proto 랜딩",
};

const PAGE_BREADCRUMB: Record<string, string> = {
  overview: "",
  employees: "시스템 관리 · 직원 보관함",
  notifications: "승인·알림 · 알림 센터",
  "pm-matching": "배정 관리 · PM 배정",
  "team-matching": "배정 관리 · 팀 매칭",
  scoping: "배정 관리 · 스코프",
  "team-mgmt": "배정 관리 · 팀·롤 관리",
  "matching-logs": "시스템 관리 · 배정 이력",
  inbox: "승인·알림 · 인박스",
  playground: "개발 · UI 샘플",
  external: "개발 · 외부 연동",
  projects: "시스템 관리 · 프로젝트",
  stats: "시스템 관리 · 통계",
  landing: "",
};

export type ProtoShellPageMeta = {
  title: string;
  breadcrumb: string;
  /** 사이드바 활성에 사용할 내비 ID(랜딩은 null) */
  navId: ProtoShellNavId | null;
};

/**
 * Next `pathname`과 `uiPrefix`(예: /proto)로 톱바 제목·브레드크럼·활성 내비 ID를 결정한다.
 */
export function getProtoShellPageMeta(uiPrefix: string, pathname: string): ProtoShellPageMeta {
  const base = uiPrefix.replace(/\/$/, "");
  const path = pathname.replace(/\/$/, "") || "/";

  if (path === base || path === `${base}/`) {
    return { title: PAGE_TITLE.landing, breadcrumb: PAGE_BREADCRUMB.landing, navId: null };
  }

  const rel = path.startsWith(`${base}/`) ? path.slice(base.length + 1) : path.replace(/^\//, "");
  const first = rel.split("/")[0] ?? "";

  const keyMap: Record<string, ProtoShellNavId> = {
    dashboard: "overview",
    "pm-matching": "pm-matching",
    "team-matching": "team-matching",
    "team-mgmt": "team-mgmt",
    "matching-logs": "matching-logs",
    inbox: "inbox",
    scoping: "scoping",
    notifications: "notifications",
    employees: "employees",
    external: "external",
    playground: "playground",
    projects: "projects",
    stats: "stats",
  };

  const navId = keyMap[first] ?? null;
  if (navId == null && first !== "") {
    return { title: "Proto", breadcrumb: "", navId: null };
  }
  const titleKey = navId ?? "landing";
  return {
    title: PAGE_TITLE[titleKey] ?? PAGE_TITLE.landing,
    breadcrumb: PAGE_BREADCRUMB[titleKey] ?? "",
    navId,
  };
}
