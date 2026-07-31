"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtoLoadingOverlay } from "@/features/proto/components/shared/ProtoLoadingOverlay";
import { protoQueryService } from "@/features/proto/services/protoQueryService";
import { PROTO_DASHBOARD_REFRESH_EVENT, protoConfig, protoLinkPageToPath } from "@/features/proto/config";
import { useProtoSessionUserKey } from "@/features/proto/lib/useProtoSessionUserKey";
import { roleFromUserKey } from "@/features/proto/lib/roleFromUserKey";
import type { ProtoDashboardData, ProtoDashboardProject, ProtoDashboardWidget, ProtoNotificationsData } from "@/features/proto/types";
import styles from "./ProtoDashboardPanel.module.css";
import shared from "../shared/protoPanelShared.module.css";

const KPI_ORDER = ["my_projects", "pipeline_size", "action_items", "pending_approvals"] as const;

const KPI_SUB: Record<(typeof KPI_ORDER)[number], string> = {
  my_projects: "현재 수행 중인 프로젝트",
  pipeline_size: "활성 사업 기회 전체",
  action_items: "즉시 처리 필요 항목",
  pending_approvals: "배정 승인 대기 중",
};

const STAGE_CONFIG = [
  { key: "Qualified", label: "PM 선임 필요 (Qualified)", color: "orange" as const },
  { key: "Negotiated", label: "제안/협상 (Negotiated)", color: "yellow" as const },
  { key: "Contracted", label: "계약 완료 (Contracted)", color: "green" as const },
];

type AppNavId =
  | "overview"
  | "pm-matching"
  | "team-matching"
  | "team-mgmt"
  | "inbox"
  | "scoping"
  | "notifications";

function linkPageToNavId(link: string | null | undefined): AppNavId | null {
  if (link == null || link === "") return null;
  const map: Record<string, AppNavId> = {
    dashboard: "overview",
    "pm-assign": "pm-matching",
    scoping: "scoping",
    matching: "team-matching",
    "team-mgmt": "team-mgmt",
    "team-status": "team-mgmt",
    inbox: "inbox",
    notif: "notifications",
  };
  return map[link] ?? null;
}

/** prototype navVisibility.canSeeNav 과 동일 규칙 */
function canSeeNav(id: AppNavId, roleUpper: string): boolean {
  const r = roleUpper.toUpperCase();
  switch (id) {
    case "overview":
    case "notifications":
      return true;
    case "pm-matching":
      return r === "AM";
    case "scoping":
    case "team-matching":
      return r === "PM" || r === "AM";
    case "team-mgmt":
      return r === "AM" || r === "PM";
    case "inbox":
      return r === "BL" || r === "SL";
    default:
      return false;
  }
}

function toneClass(id: string): string {
  if (id === "my_projects") return styles.kpiGreen;
  if (id === "pipeline_size") return styles.kpiAccent;
  if (id === "action_items") return styles.kpiOrange;
  if (id === "pending_approvals") return styles.kpiYellow;
  return "";
}

function fmt(id: string, n: number): string {
  if (id === "pipeline_size") {
    return `₩${Math.round(n * 100_000_000).toLocaleString("ko-KR")}`;
  }
  if (id === "action_items" || id === "pending_approvals") {
    return `${Math.round(n)}건`;
  }
  return String(Math.round(n));
}

function dashboardProjectNumericId(p: ProtoDashboardProject): number | undefined {
  const raw = p.id;
  if (raw == null) return undefined;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function teamPctToneClass(pct: number): string {
  if (pct >= 100) return styles.pctComplete;
  if (pct > 50) return styles.pctMid;
  return styles.pctLow;
}

function formatDealSizeEok(v: number | undefined): string {
  const eok = Number.isFinite(v as number) ? (v as number) : 0;
  return `₩${Math.round(eok * 100_000_000).toLocaleString("ko-KR")}`;
}

function stageBadgeTone(color: "orange" | "yellow" | "green"): string {
  if (color === "orange") return styles.stageBadgeOrange;
  if (color === "yellow") return styles.stageBadgeYellow;
  return styles.stageBadgeGreen;
}

function pjtWinTone(color: "orange" | "yellow" | "green"): string {
  if (color === "orange") return styles.pjtWinOrange;
  if (color === "yellow") return styles.pjtWinYellow;
  return styles.pjtWinGreen;
}

export default function ProtoDashboardPanel() {
  const router = useRouter();
  const userKey = useProtoSessionUserKey();
  const roleUpper = useMemo(() => roleFromUserKey(userKey), [userKey]);
  const [data, setData] = useState<ProtoDashboardData | null>(null);
  const [notifData, setNotifData] = useState<ProtoNotificationsData | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = useCallback(
    async (silent: boolean) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError("");
        const [dash, notif] = await Promise.all([
          protoQueryService.getDashboard(),
          protoQueryService.getNotifications(roleUpper),
        ]);
        setData(dash);
        setNotifData(notif);
        setUnreadCount(notif.unreadCount ?? 0);
      } catch (e) {
        const message = e instanceof Error ? e.message : "대시보드 조회 실패";
        setError(message);
        setData(null);
        setNotifData(null);
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [roleUpper],
  );

  useEffect(() => {
    void fetchAll(false);
  }, [fetchAll]);

  useEffect(() => {
    const onRefresh = () => {
      void fetchAll(true);
    };
    window.addEventListener(PROTO_DASHBOARD_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(PROTO_DASHBOARD_REFRESH_EVENT, onRefresh);
  }, [fetchAll]);

  const orderedWidgets = useMemo(() => {
    const widgets = data?.widgets ?? [];
    const byId = new Map<string, ProtoDashboardWidget>();
    for (const w of widgets) {
      byId.set(w.id, w);
    }
    return KPI_ORDER.map((id) => byId.get(id)).filter((w): w is ProtoDashboardWidget => w != null);
  }, [data]);

  const projects = useMemo(() => (Array.isArray(data?.projects) ? data!.projects! : []), [data]);

  const pipelineByStage = useMemo(() => {
    const base: Record<string, ProtoDashboardProject[]> = {
      Qualified: [],
      Negotiated: [],
      Contracted: [],
    };
    for (const p of projects) {
      const stage = p.pipelineStage ?? "";
      if (stage in base) base[stage].push(p);
    }
    return base;
  }, [projects]);

  const ongoingTeamProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const stage = (p.pipelineStage ?? "").toLowerCase();
        return (stage === "contracted" || stage === "negotiated") && p.pmName != null && p.pmName !== "";
      })
      .sort((a, b) => ((b.teamPct ?? 0) as number) - ((a.teamPct ?? 0) as number))
      .slice(0, 12);
  }, [projects]);

  const taskPreview = useMemo(() => {
    if (!notifData) return [];
    const unread = (notifData.notifications ?? []).filter((n) => !(n.isRead ?? false));
    return unread.slice(0, 5).map((n) => {
      const link = n.linkPage ?? "";
      const nav = linkPageToNavId(link);
      const can = nav != null && canSeeNav(nav, roleUpper);
      const mappedPath = protoLinkPageToPath(link);
      const href = can && mappedPath ? mappedPath : protoConfig.uiPrefixNotifications;
      const title = (n.title != null && n.title !== "" ? n.title : n.message) || "알림";
      return { id: n.id, title, target: href };
    });
  }, [notifData, roleUpper]);

  const pendingApprovals = useMemo(() => {
    const w = orderedWidgets.find((x) => x.id === "pending_approvals");
    const raw = w?.value;
    const n = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(n) ? n : 0;
  }, [orderedWidgets]);

  const onKpiClick = (id: string) => {
    if (id === "action_items") {
      router.push(protoConfig.uiPrefixNotifications);
    } else if (id === "pending_approvals") {
      router.push(protoConfig.uiPrefixInbox);
    }
  };

  const goTeamMgmt = (pid: number | undefined) => {
    if (pid != null) {
      router.push(`${protoConfig.uiPrefix}/team-mgmt?projectId=${pid}`);
    } else {
      router.push(`${protoConfig.uiPrefix}/team-mgmt`);
    }
  };

  const goPmMatching = (pid: number | undefined) => {
    if (pid != null) {
      router.push(`${protoConfig.uiPrefix}/pm-matching?projectId=${pid}`);
    } else {
      router.push(`${protoConfig.uiPrefix}/pm-matching`);
    }
  };

  const overlayBusy = loading || refreshing;
  if (error) {
    return <p className={shared.err}>오류: {error}</p>;
  }

  if (!loading && (!data || orderedWidgets.length === 0)) {
    return <p>표시할 대시보드 데이터가 없습니다.</p>;
  }

  return (
    <section className={styles.wrap}>
      <div aria-busy={overlayBusy}>
      <ProtoLoadingOverlay active={overlayBusy} />
      {refreshing ? <p className={styles.refreshing}>지표 새로고침 중…</p> : null}

      <div className={styles.stackLg}>
      <div className={styles.grid}>
        {orderedWidgets.map((widget) => {
          const id = widget.id as (typeof KPI_ORDER)[number];
          const clickable = id === "action_items" || id === "pending_approvals";
          const sub = KPI_SUB[id] ?? "";
          const cardClass = [styles.kpi, toneClass(widget.id), clickable ? styles.kpiClickable : ""]
            .filter(Boolean)
            .join(" ");
          const inner = (
            <>
              <p className={styles.kpiLabel}>{widget.label}</p>
              <p className={styles.kpiValue}>{fmt(widget.id, Number(widget.value))}</p>
              {sub ? <p className={styles.kpiSub}>{sub}</p> : null}
            </>
          );
          return clickable ? (
            <button key={widget.id} type="button" className={cardClass} onClick={() => onKpiClick(widget.id)}>
              {inner}
            </button>
          ) : (
            <div key={widget.id} className={cardClass}>
              {inner}
            </div>
          );
        })}
      </div>

      <div className={styles.taskAlert}>
        <div className={styles.taskAlertIcon}>🔔</div>
        <div>
          <div className={styles.taskAlertTitle}>Action Required · Task 알림</div>
          <div className={styles.taskAlertItems}>
            {taskPreview.length > 0 ? (
              taskPreview.map((task) => (
                <button key={task.id} type="button" className={styles.taskItem} onClick={() => router.push(task.target)}>
                  <span className={styles.taskArrow}>▶</span>
                  <span className={styles.taskText}>{task.title}</span>
                  <span className={styles.taskMeta}>즉시 확인</span>
                </button>
              ))
            ) : (
              <span className={styles.taskEmpty}>처리가 필요한 알림이 없습니다.</span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <section className={styles.bottomColLeft}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>Pipeline 단계별 사업 현황</div>
            <div className={styles.sectionSub}>Qualified 이상 영업기회 조회</div>
          </div>
          <div className={styles.bottomColScroll}>
            <div className={styles.stageStack}>
            {STAGE_CONFIG.map((cfg) => {
              const stageProjects = pipelineByStage[cfg.key] ?? [];
              return (
                <div key={cfg.key} className={styles.stagePanel}>
                  <div className={styles.stageHeader}>
                    {cfg.label}
                    <span className={`${styles.stageBadge} ${stageBadgeTone(cfg.color)}`}>
                      {stageProjects.length}
                    </span>
                  </div>
                  <div className={styles.stageBody}>
                    {stageProjects.length === 0 ? (
                      <div className={styles.stageEmpty}>해당 단계 프로젝트 없음</div>
                    ) : (
                      stageProjects.map((p, idx) => {
                        const hasPm = p.pmName != null && p.pmName !== "";
                        const teamPct = p.teamPct ?? 0;
                        const canClick = roleUpper === "AM" || roleUpper === "PM";
                        const pid = dashboardProjectNumericId(p);
                        return (
                          <article
                            key={`${p.id ?? p.name ?? idx}`}
                            className={`${styles.pjtCard} ${canClick ? styles.pjtCardClick : ""}`}
                            onClick={canClick ? () => goTeamMgmt(pid) : undefined}
                            onKeyDown={
                              canClick
                                ? (e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      goTeamMgmt(pid);
                                    }
                                  }
                                : undefined
                            }
                            role={canClick ? "button" : undefined}
                            tabIndex={canClick ? 0 : undefined}
                          >
                            <span className={`${styles.pjtWin} ${pjtWinTone(cfg.color)}`}>
                              {Math.round((p.winProbability ?? 0) * 100)}% Win
                            </span>
                            <div className={styles.pjtName}>{p.name ?? "이름 없음"}</div>
                            <div className={styles.pjtClient}>{p.client ?? "-"}</div>
                            <div className={styles.pjtAmount}>{formatDealSizeEok(p.dealSize)}</div>
                            <div className={styles.pjtRow}>
                              <span className={hasPm ? `${styles.tag} ${styles.tagGreen}` : `${styles.tag} ${styles.tagOrange}`}>
                                {hasPm ? `PM: ${p.pmName}` : "PM 미배정"}
                              </span>
                            </div>
                            <div className={styles.pjtProgressRow}>
                              <div className={styles.progWrap}>
                                <div className={`${styles.progBar} ${styles.pjtProgBar}`}>
                                  <span className={styles.progFill} style={{ width: `${teamPct}%` }} />
                                </div>
                              </div>
                              <span className={`${styles.pjtPct} ${teamPctToneClass(teamPct)}`}>{teamPct}%</span>
                            </div>
                            {roleUpper === "AM" && !hasPm ? (
                              <button
                                type="button"
                                className={styles.btnSolid}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  goPmMatching(pid);
                                }}
                                disabled={pid == null}
                              >
                                PM 배정
                              </button>
                            ) : null}
                            {(roleUpper === "AM" || roleUpper === "PM") && hasPm ? (
                              <button
                                type="button"
                                className={styles.btnOutline}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  goTeamMgmt(pid);
                                }}
                              >
                                팀 배정 관리
                              </button>
                            ) : null}
                          </article>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </section>

        <section className={styles.bottomColRight}>
          <div className={`${styles.sectionHead} ${styles.sectionHeadRow}`}>
            <div>
              <div className={styles.sectionTitle}>진행 중 프로젝트</div>
              <div className={styles.sectionSub}>팀 배정 현황 실시간 조회</div>
            </div>
            <button type="button" className={styles.btnOutlineSm} onClick={() => router.push(`${protoConfig.uiPrefix}/team-mgmt`)}>
              전체 보기 →
            </button>
          </div>
          <div className={styles.bottomColScroll}>
          <div className={styles.ongoingList}>
            {ongoingTeamProjects.length > 0 ? (
              ongoingTeamProjects.map((p, idx) => {
                const teamPct = p.teamPct ?? 0;
                const canClick = roleUpper === "AM" || roleUpper === "PM";
                const chipClass = teamPct >= 100 ? styles.chipOngoing : styles.chipReady;
                const pid = dashboardProjectNumericId(p);
                return (
                  <article
                    key={`${p.id ?? p.name ?? idx}`}
                    className={`${styles.activeCard} ${canClick ? styles.activeCardClick : ""}`}
                    onClick={canClick ? () => goTeamMgmt(pid) : undefined}
                    role={canClick ? "button" : undefined}
                    tabIndex={canClick ? 0 : undefined}
                  >
                    <div className={styles.activeTop}>
                      <span className={chipClass}>{p.pipelineStage ?? ""}</span>
                      <div className={styles.activeName}>{p.name ?? "이름 없음"}</div>
                      <div className={styles.activeMeta}>
                        {p.client ?? "-"} · {p.startDate ?? "-"} ~ {p.endDate ?? "-"}
                      </div>
                    </div>
                    <div className={styles.activeProgressRow}>
                      <div className={styles.activeProgressMain}>
                        <div className={styles.progressLabel}>팀 구성 진행률</div>
                        <div className={styles.progBar}>
                          <span className={styles.progFill} style={{ width: `${teamPct}%` }} />
                        </div>
                      </div>
                      <div className={`${styles.activePct} ${teamPctToneClass(teamPct)}`}>{teamPct}%</div>
                    </div>
                    <div className={styles.activeTags}>
                      <span className={`${styles.tag} ${styles.tagNeutral}`}>
                        {p.teamFilled ?? 0}/{p.teamTotal ?? 0} 역할 배정
                      </span>
                      {p.pmName ? (
                        <span className={`${styles.tag} ${styles.tagGreen}`}>PM: {p.pmName}</span>
                      ) : null}
                    </div>
                    {canClick ? (
                      <div className={styles.activeBtnWrap}>
                        <button
                          type="button"
                          className={styles.btnSolid}
                          onClick={(e) => {
                            e.stopPropagation();
                            goTeamMgmt(pid);
                          }}
                        >
                          팀 배정 관리
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <p className={styles.emptyState}>진행 중인 팀 배정 프로젝트가 없습니다.</p>
            )}
          </div>
          </div>
        </section>
      </div>

      <p className={styles.footnote}>
        미읽음 알림 {unreadCount}건 · 승인 대기 {pendingApprovals}건
      </p>

      <p className={styles.hint}>Action Required / 승인 진행중 카드를 누르면 알림·인박스로 이동합니다.</p>
      </div>
      </div>
    </section>
  );
}
