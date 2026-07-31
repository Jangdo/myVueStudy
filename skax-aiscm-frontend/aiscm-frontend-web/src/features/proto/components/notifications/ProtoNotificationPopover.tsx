"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { protoConfig, protoLinkPageToNavId, protoLinkPageToPath } from "@/features/proto/config";
import { canSeeProtoNav } from "@/features/proto/lib/protoNavVisibility";
import { protoCommandService } from "@/features/proto/services/protoCommandService";
import { protoQueryService } from "@/features/proto/services/protoQueryService";
import type { ProtoNotificationItem } from "@/features/proto/types";
import "@/features/proto/styles/notifications/proto-notification-popover.css";

type Props = {
  /** prototype `roleFromUserKey` — 알림 API·가시성과 동일 */
  roleUpper: string;
  unreadCount: number;
  /** 읽음 처리 후 사이드바 배지 등 재조회 */
  onRefreshBadges: () => void;
};

function isUnread(n: { isRead?: boolean | null }): boolean {
  return !(n.isRead ?? false);
}

/**
 * prototype `NotificationPopover` — 최근 알림 미리보기·링크 이동·읽음 처리.
 */
export default function ProtoNotificationPopover({ roleUpper, unreadCount, onRefreshBadges }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ProtoNotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await protoQueryService.getNotifications(roleUpper);
      setItems(data.notifications ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [roleUpper]);

  useEffect(() => {
    if (!open) return;
    void fetchList();
  }, [open, fetchList]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current != null && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const onItemActivate = async (n: ProtoNotificationItem) => {
    const navId = protoLinkPageToNavId(n.linkPage);
    const href = protoLinkPageToPath(n.linkPage);
    if (href != null && navId != null && canSeeProtoNav(navId, roleUpper)) {
      setOpen(false);
      router.push(href);
    }
    if (isUnread(n)) {
      try {
        await protoCommandService.markNotificationReadPut(n.id);
        await fetchList();
        onRefreshBadges();
      } catch {
        /* prototype 과 동일: 무시 */
      }
    }
  };

  const prefix = protoConfig.uiPrefix.replace(/\/$/, "");
  const preview = items.slice(0, 8);

  return (
    <div className="notif-popover-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notif-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="알림 열기"
      >
        <span className="notif-trigger__icon" aria-hidden>
          🔔
        </span>
        {unreadCount > 0 ? (
          <span className="notif-trigger-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        ) : null}
      </button>
      {open ? (
        <div className="notif-popover" role="dialog" aria-label="알림 미리보기">
          <div className="notif-popover__head">
            <span>최근 알림</span>
            {loading ? <span className="notif-popover__muted">불러오는 중</span> : null}
          </div>
          {preview.length === 0 ? (
            <p className="notif-popover__empty">알림이 없습니다.</p>
          ) : (
            <ul className="notif-popover__list">
              {preview.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={"notif-popover__item" + (isUnread(n) ? " notif-popover__item--unread" : "")}
                    onClick={() => void onItemActivate(n)}
                  >
                    <span className="notif-popover__title">{n.title ?? "(제목 없음)"}</span>
                    {n.message ? <span className="notif-popover__msg">{n.message}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="notif-popover__foot">
            <button
              type="button"
              className="notif-popover__foot-btn"
              onClick={() => {
                setOpen(false);
                router.push(`${prefix}/notifications`);
              }}
            >
              알림 센터로 이동
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
