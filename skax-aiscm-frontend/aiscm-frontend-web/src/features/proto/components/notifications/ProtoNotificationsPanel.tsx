"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { protoCommandService } from "@/features/proto/services/protoCommandService";
import { protoQueryService } from "@/features/proto/services/protoQueryService";
import { protoLinkPageToPath } from "@/features/proto/config";
import type { ProtoNotificationItem } from "@/features/proto/types";
import "@/features/proto/styles/notifications/notifications-parity.css";

function isUnread(n: { isRead?: boolean | null }): boolean {
  return !(n.isRead ?? false);
}

function formatRelativeTimeKo(iso: string | null | undefined): string {
  if (iso == null || iso === "") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs >= 0 && diffMs < 60_000) return "방금 전";
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "어제";
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function recentLabelClass(n: ProtoNotificationItem): string {
  const t = String(n.notificationType ?? "").toLowerCase();
  if (t === "alert") return "notif-page__recent-label notif-page__recent-label--alert";
  if (t === "task") return "notif-page__recent-label notif-page__recent-label--task";
  if (t === "info") return "notif-page__recent-label notif-page__recent-label--info";
  return "notif-page__recent-label";
}

const STATIC_TASK_FALLBACK: Array<{ text: string; link: string }> = [
  {
    text: "프로젝트 범위 정의(Scoping) 요망 – 금융 그룹 차세대 클라우드 전환 2단계 PJT로 진행 필요합니다.",
    link: "scoping",
  },
  {
    text: "프로젝트 범위 정의(Scoping) 요망 – 글로벌 물류 플랫폼 고도화 20개의 정의 과정을 시작하세요.",
    link: "scoping",
  },
];

function linkPageToHref(link: string | null | undefined): string | null {
  return protoLinkPageToPath(link ?? undefined);
}

/**
 * prototype NotificationsPanel 과 동일 레이아웃·스타일·상태전이(읽음 후 재조회).
 * 역할 필터는 쿼리 `?role=AM|PM|BL|SL` (기본 AM) — 화면에 별도 셀렉트 없음.
 */
export default function ProtoNotificationsPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = useMemo(() => {
    const r = searchParams.get("role");
    return r != null && r !== "" ? r.toUpperCase() : "AM";
  }, [searchParams]);

  const [items, setItems] = useState<ProtoNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent: boolean) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);
        const response = await protoQueryService.getNotifications(role);
        setItems(response.notifications ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "알림 조회 실패");
        setItems([]);
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [role],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const markRead = async (id: number): Promise<void> => {
    try {
      await protoCommandService.markNotificationReadPut(id);
      await load(true);
    } catch {
      /* prototype 과 동일: 무시 */
    }
  };

  const taskRows = useMemo(() => {
    const fromApi = items.filter(
      (n) =>
        String(n.notificationType ?? "").toLowerCase() === "task" ||
        String(n.linkPage ?? "") === "scoping" ||
        /scoping/i.test(n.title ?? ""),
    );
    if (fromApi.length > 0) {
      return fromApi.map((n) => ({
        key: `t-${n.id}`,
        text: [n.title, n.message].filter(Boolean).join(" – ") || (n.title ?? n.message),
        link: n.linkPage ?? null,
        id: n.id as number,
      }));
    }
    return STATIC_TASK_FALLBACK.map((row, i) => ({
      key: `fb-${i}`,
      text: row.text,
      link: row.link,
      id: undefined as number | undefined,
    }));
  }, [items]);

  const onRecentRowActivate = (n: ProtoNotificationItem) => {
    const path = linkPageToHref(n.linkPage ?? undefined);
    if (isUnread(n)) {
      void markRead(n.id);
    }
    if (path) {
      router.push(path);
    }
  };

  const onTaskActivate = (link: string | null | undefined, id?: number) => {
    if (id != null) {
      const item = items.find((x) => x.id === id);
      if (item && isUnread(item)) {
        void markRead(id);
      }
    }
    const path = linkPageToHref(link ?? "scoping");
    if (path) {
      router.push(path);
    }
  };

  return (
    <div className="notif-page" aria-busy={loading}>
      {loading ? (
        <div className="proto-notif-loading-overlay" role="status" aria-live="polite" aria-label="불러오는 중…">
          <div className="proto-notif-loading-overlay__spinner" aria-hidden />
          <p className="proto-notif-loading-overlay__label">불러오는 중…</p>
        </div>
      ) : null}

      {!loading ? (
        <>
      {error ? <p className="notif-page__state notif-page__state--error">{error}</p> : null}
      {refreshing ? <p className="notif-page__state">목록 새로고침 중…</p> : null}

      <div className="notif-page__section-title">최근 알림 (Recent)</div>
      <div className="notif-page__panel">
        {!error && items.length === 0 ? (
          <div className="notif-page__recent-row">
            <div className="notif-page__dot notif-page__dot--read" aria-hidden />
            <div className="notif-page__recent-main">
              <div className="notif-page__recent-sub">알림이 없습니다.</div>
            </div>
            <div className="notif-page__recent-time">—</div>
          </div>
        ) : null}
        {items.map((n) => {
          const path = linkPageToHref(n.linkPage ?? undefined);
          const clickable = path != null;
          return (
            <div
              key={n.id}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              className={"notif-page__recent-row" + (clickable ? " notif-page__recent-row--clickable" : "")}
              onClick={clickable ? () => onRecentRowActivate(n) : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRecentRowActivate(n);
                      }
                    }
                  : undefined
              }
            >
              <div
                className={"notif-page__dot " + (isUnread(n) ? "notif-page__dot--unread" : "notif-page__dot--read")}
                aria-hidden
              />
              <div className="notif-page__recent-main">
                <div className={recentLabelClass(n)}>
                  {n.title != null && n.title.trim() !== "" ? n.title : n.message}
                </div>
                {n.title != null && n.title.trim() !== "" && n.message ? (
                  <div className="notif-page__recent-sub">{n.message}</div>
                ) : null}
              </div>
              <div className="notif-page__recent-time">{formatRelativeTimeKo(n.createdAt)}</div>
            </div>
          );
        })}
      </div>

      <div className="notif-page__section-title notif-page__section-title--spaced">주요 일정</div>
      <div className="notif-page__schedule">
        <div className="notif-page__schedule-badge">D-2</div>
        <div>
          <div className="notif-page__schedule-title">글로벌 SCM 착수 보고</div>
          <div className="notif-page__schedule-meta">2026.02.01 (월) 14:00</div>
        </div>
      </div>

      <div className="notif-page__section-title notif-page__section-title--spaced">나의 태스크 (My Tasks)</div>
      <div className="notif-page__panel">
        {taskRows.map((row) => {
          const path = linkPageToHref(row.link ?? undefined);
          const clickable = path != null;
          return (
            <div
              key={row.key}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              className={"notif-page__task-row" + (clickable ? "" : " notif-page__task-row--static")}
              onClick={clickable ? () => onTaskActivate(row.link, row.id) : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onTaskActivate(row.link, row.id);
                      }
                    }
                  : undefined
              }
            >
              <span className="notif-page__task-dot" aria-hidden />
              <span className="notif-page__task-text">{row.text}</span>
            </div>
          );
        })}
      </div>
        </>
      ) : null}
    </div>
  );
}
