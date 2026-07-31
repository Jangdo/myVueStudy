"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { protoConfig, PROTO_DASHBOARD_REFRESH_EVENT } from "@/features/proto/config";
import {
  filterProtoNavSections,
  type ProtoNavSection,
  type ProtoNavSectionItem,
  type ProtoShellNavId,
} from "@/features/proto/lib/protoNavVisibility";
import { getProtoShellPageMeta } from "@/features/proto/lib/protoShellMeta";
import { roleFromUserKey } from "@/features/proto/lib/roleFromUserKey";
import { useProtoSessionContext } from "@/features/proto/lib/ProtoSessionContext";
import { protoQueryService } from "@/features/proto/services/protoQueryService";
import type { ProtoUserItem } from "@/features/proto/types";
import { protoNavIconById } from "@/features/proto/components/layout/ProtoNavIcons";
import ProtoNotificationPopover from "@/features/proto/components/notifications/ProtoNotificationPopover";
import ProtoThemeToggle from "@/features/proto/components/layout/ProtoThemeToggle";

const USER_OPTIONS_FALLBACK: ProtoUserItem[] = [
  { id: "pm", name: "이티밍", role: "PM", title: "Application PM", desc: "글로벌 SCM PM" },
  { id: "am", name: "김영업", role: "AM", title: "Account Manager", desc: "영업 총괄" },
  { id: "bl", name: "박팀장", role: "BL", title: "Business Leader", desc: "사업부장" },
  { id: "sl", name: "이팀장", role: "SL", title: "Service Leader", desc: "운영팀장" },
];

function NavBadge({ count, variant = "accent" }: { count: number; variant?: "accent" | "orange" }) {
  if (count <= 0) return null;
  return (
    <span className={`app-shell__nav-badge app-shell__nav-badge--${variant}`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

function buildRawNavSections(args: {
  prefix: string;
  unreadCount: number;
  pendingApprovals: number;
}): ProtoNavSection[] {
  const { prefix, unreadCount, pendingApprovals } = args;

  const assignItems: ProtoNavSectionItem[] = [
    {
      id: "pm-matching",
      label: "PM 배정 관리",
      href: `${prefix}/pm-matching`,
      badge: { count: 1, variant: "orange" },
    },
    {
      id: "team-mgmt",
      label: "프로젝트 팀 배정 관리",
      href: `${prefix}/team-mgmt`,
      subItems: [
        { id: "scoping", label: "프로젝트 범위 정의", href: `${prefix}/scoping` },
        { id: "team-matching", label: "팀원 배정", href: `${prefix}/team-matching` },
      ],
    },
    {
      id: "inbox",
      label: "배정 승인 관리",
      href: `${prefix}/inbox`,
      badge: pendingApprovals > 0 ? { count: pendingApprovals, variant: "accent" } : undefined,
    },
  ];

  return [
    {
      heading: "홈 대시보드",
      items: [{ id: "overview", label: "요약보드", href: `${prefix}/dashboard` }],
    },
    { heading: "배정 관리", items: assignItems },
    {
      heading: "알림",
      items: [
        {
          id: "notifications",
          label: "알림센터",
          href: `${prefix}/notifications`,
          badge: unreadCount > 0 ? { count: unreadCount, variant: "accent" } : undefined,
        },
      ],
    },
    {
      heading: "시스템 관리",
      items: [
        { id: "employees", label: "직원 보관함", href: `${prefix}/employees` },
        { id: "matching-logs", label: "배정 이력", href: `${prefix}/matching-logs` },
        { id: "projects", label: "프로젝트", href: `${prefix}/projects` },
        { id: "stats", label: "통계", href: `${prefix}/stats` },
      ],
    },
    {
      heading: "개발",
      items: [
        { id: "playground", label: "UI 샘플", href: `${prefix}/playground` },
        { id: "external", label: "외부 연동", href: `${prefix}/external` },
      ],
    },
  ];
}

function parentItemActive(item: ProtoNavSectionItem, navId: ProtoShellNavId | null): boolean {
  if (navId == null) return false;
  if (item.subItems != null && item.subItems.length > 0 && item.id === "team-mgmt") {
    return navId === "team-mgmt" || navId === "scoping" || navId === "team-matching";
  }
  return item.id === navId;
}

function subItemActive(subId: ProtoShellNavId, navId: ProtoShellNavId | null): boolean {
  return navId != null && subId === navId;
}

export default function ProtoShellLayout({ children }: { children: ReactNode }) {
  const session = useProtoSessionContext();
  const router = useRouter();
  const pathname = usePathname();
  const prefix = protoConfig.uiPrefix.replace(/\/$/, "");
  const pageMeta = getProtoShellPageMeta(protoConfig.uiPrefix, pathname ?? "");

  const [userOptions, setUserOptions] = useState<ProtoUserItem[]>(USER_OPTIONS_FALLBACK);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [openSub, setOpenSub] = useState<Record<string, boolean>>({ "team-mgmt": true });
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [isClockMounted, setIsClockMounted] = useState(false);
  const [syncTime, setSyncTime] = useState("--:--:--");

  const userMenuRef = useRef<HTMLDivElement>(null);
  const userKey = session?.userKey ?? "am";
  const roleUpper = roleFromUserKey(userKey);

  const sidebarUserName = useMemo(() => {
    const row = userOptions.find((o) => o.id === userKey);
    return row != null ? row.name : userKey;
  }, [userKey, userOptions]);

  const sidebarUserMeta = useMemo(() => {
    const row = userOptions.find((o) => o.id === userKey);
    if (row == null) return roleUpper;
    return row.title !== "" ? row.title : row.role;
  }, [roleUpper, userKey, userOptions]);

  const navSections = useMemo(() => {
    const raw = buildRawNavSections({ prefix, unreadCount, pendingApprovals });
    return filterProtoNavSections(raw, roleUpper);
  }, [prefix, unreadCount, pendingApprovals, roleUpper]);

  const loadBadges = useCallback(async () => {
    const role = roleFromUserKey(userKey);
    try {
      const notif = await protoQueryService.getNotifications(role);
      setUnreadCount(typeof notif.unreadCount === "number" ? notif.unreadCount : 0);
    } catch {
      setUnreadCount(0);
    }
    try {
      if (role === "BL" || role === "SL") {
        const approvals = await protoQueryService.getApprovals(role);
        setPendingApprovals(Array.isArray(approvals) ? approvals.length : 0);
      } else {
        setPendingApprovals(0);
      }
    } catch {
      setPendingApprovals(0);
    }
  }, [userKey]);

  useEffect(() => {
    void loadBadges();
  }, [loadBadges]);

  useEffect(() => {
    const onRefresh = () => void loadBadges();
    window.addEventListener(PROTO_DASHBOARD_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(PROTO_DASHBOARD_REFRESH_EVENT, onRefresh);
  }, [loadBadges]);

  useEffect(() => {
    setIsClockMounted(true);
    const tick = () =>
      setSyncTime(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const list = await protoQueryService.getUsers();
        if (!Array.isArray(list) || list.length === 0) {
          setUserOptions(USER_OPTIONS_FALLBACK);
          return;
        }
        setUserOptions(list);
        const first = list[0]?.id ?? "am";
        if (!list.some((u) => u.id === userKey)) {
          session?.setUserKey(first);
        }
      } catch {
        setUserOptions(USER_OPTIONS_FALLBACK);
        if (!USER_OPTIONS_FALLBACK.some((u) => u.id === userKey)) {
          session?.setUserKey(USER_OPTIONS_FALLBACK[0].id);
        }
      }
    })();
  }, [session, userKey]);

  useEffect(() => {
    const targets = [
      `${prefix}/dashboard`,
      `${prefix}/pm-matching`,
      `${prefix}/team-mgmt`,
      `${prefix}/employees`,
      `${prefix}/notifications`,
      `${prefix}/inbox`,
    ];
    for (const href of targets) {
      router.prefetch(href);
    }
  }, [prefix, router]);

  useEffect(() => {
    if (userOptions.length === 0) return;
    const ok = userOptions.some((o) => o.id === userKey);
    if (!ok) {
      const next = userOptions[0].id;
      session?.setUserKey(next);
    }
  }, [session, userKey, userOptions]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (userMenuRef.current != null && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [userMenuOpen]);

  const navId = pageMeta.navId;

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <Link href={prefix} className="app-shell__sidebar-brand" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="app-shell__logo-mark">AI</span>
          <div>
            <div className="app-shell__logo-title">AI Teaming</div>
            <div className="app-shell__logo-sub">SK AX SCM</div>
          </div>
        </Link>
        <nav className="app-shell__nav">
          {navSections.map((sec, idx) => (
            <div key={idx} className="app-shell__nav-section">
              {sec.heading != null && sec.heading !== "" ? (
                <div className="app-shell__nav-heading">{sec.heading}</div>
              ) : null}
              <ul className="app-shell__nav-list">
                {sec.items.map((item) => {
                  const hasSub = item.subItems != null && item.subItems.length > 0;
                  const expanded = openSub[item.id] ?? true;
                  const parentActive = parentItemActive(item, navId);

                  return (
                    <li key={item.id} className="app-shell__nav-item-wrap">
                      <div className="app-shell__nav-row">
                        <Link
                          href={item.href}
                          className={"app-shell__nav-link" + (parentActive ? " app-shell__nav-link--active" : "")}
                          onClick={() => {
                            if (hasSub) {
                              setOpenSub((prev) => ({ ...prev, [item.id]: true }));
                            }
                          }}
                        >
                          <span className="app-shell__nav-icon-wrap">{protoNavIconById(item.id)}</span>
                          <span className="app-shell__nav-link-text">{item.label}</span>
                          <span className="app-shell__nav-meta">
                            {item.badge != null ? (
                              <NavBadge count={item.badge.count} variant={item.badge.variant} />
                            ) : null}
                          </span>
                        </Link>
                        {hasSub ? (
                          <button
                            type="button"
                            className={
                              "app-shell__nav-chevron-toggle" + (expanded ? " app-shell__nav-chevron-toggle--open" : "")
                            }
                            aria-expanded={expanded}
                            aria-label="하위 메뉴 펼침"
                            onClick={(e) => {
                              e.preventDefault();
                              setOpenSub((prev) => ({
                                ...prev,
                                [item.id]: !(prev[item.id] ?? true),
                              }));
                            }}
                          >
                            ▾
                          </button>
                        ) : null}
                      </div>
                      {hasSub && expanded ? (
                        <ul className="app-shell__nav-sublist">
                          {item.subItems!.map((sub) => (
                            <li key={sub.id}>
                              <Link
                                href={sub.href}
                                className={
                                  "app-shell__nav-link app-shell__nav-link--sub" +
                                  (subItemActive(sub.id, navId) ? " app-shell__nav-link--active" : "")
                                }
                              >
                                <span className="app-shell__nav-icon-wrap">{protoNavIconById(sub.id)}</span>
                                {sub.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="app-shell__sidebar-footer">
          <div className="app-shell-user-menu" ref={userMenuRef}>
            <button
              type="button"
              className="app-shell-user app-shell-user--button"
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={userMenuOpen}
            >
              <div className="app-shell-user__avatar">{roleUpper.charAt(0)}</div>
              <div>
                <div className="app-shell-user__name">{sidebarUserName}</div>
                <div className="app-shell-user__role">{sidebarUserMeta}</div>
              </div>
              <span className="app-shell-user__arrow">{userMenuOpen ? "▴" : "▾"}</span>
            </button>
            {userMenuOpen ? (
              <div className="app-shell-user-dropdown" role="listbox" aria-label="사용자 선택">
                {userOptions.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className={
                      "app-shell-user-option" + (o.id === userKey ? " app-shell-user-option--active" : "")
                    }
                    onClick={() => {
                      session?.setUserKey(o.id);
                      setUserMenuOpen(false);
                    }}
                  >
                    <span className="app-shell-user-option__avatar">{o.name.charAt(0)}</span>
                    <span className="app-shell-user-option__text">
                      <span className="app-shell-user-option__name">{o.name}</span>
                      <span className="app-shell-user-option__sub">
                        {o.title !== "" ? o.title : o.role}
                        {o.desc !== "" ? ` · ${o.desc}` : ""}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="app-shell__column">
        <header className="app-shell__topbar">
          <div className="app-shell__topbar-left">
            <h2 className="app-shell__page-title">{pageMeta.title}</h2>
            {pageMeta.breadcrumb !== "" ? <p className="app-shell__breadcrumb">{pageMeta.breadcrumb}</p> : null}
          </div>
          <div className="app-shell__topbar-sync" title="동기화 상태">
            <span className="app-shell__sync-dot" />
            <span className="app-shell__sync-text">Synced {isClockMounted ? syncTime : "--:--:--"}</span>
          </div>
          <div className="app-shell__topbar-actions">
            <div className="app-header-toast">
              <ProtoNotificationPopover
                roleUpper={roleUpper}
                unreadCount={unreadCount}
                onRefreshBadges={() => void loadBadges()}
              />
              <ProtoThemeToggle />
              <span className="proto-topbar-unread-badge">Unread {unreadCount}</span>
              <div className="app-topbar-avatar" title={roleUpper}>
                {roleUpper.charAt(0)}
              </div>
            </div>
          </div>
        </header>
        <main id="app-shell-main" className="app-shell__main">
          {children}
        </main>
      </div>
    </div>
  );
}
