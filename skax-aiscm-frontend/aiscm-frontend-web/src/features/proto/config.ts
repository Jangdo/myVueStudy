import type { ProtoShellNavId } from "@/features/proto/lib/protoNavVisibility";
import { protoApiPrefix } from "@/shared/config/apiSurfaces";

/** proto UI 접두 — OS 환경 변수 미사용, 변경 시 이 상수만 수정 */
const PROTO_UI_PREFIX = "/proto";
/** proto API 접두 — `apiSurfaces`·Proto *RestController @RequestMapping·게이트웨이 proto 라우트와 동일 */
const PROTO_API_PREFIX = protoApiPrefix;
/** false 로 두면 /proto 샘플 기능 비활성화 */
const PROTO_ENABLED = true;

/** 승인 처리 등 후 대시보드 KPI 재조회용 CustomEvent 이름 (prototype fetchDashboard 연계) */
export const PROTO_DASHBOARD_REFRESH_EVENT = "proto-dashboard-refresh";

export const protoConfig = {
  enabled: PROTO_ENABLED,
  uiPrefix: PROTO_UI_PREFIX,
  uiPrefixNotifications: `${PROTO_UI_PREFIX}/notifications`,
  uiPrefixInbox: `${PROTO_UI_PREFIX}/inbox`,
  apiPrefix: PROTO_API_PREFIX,
};

/** prototype notifications `link_page` → Next `/proto/**` 경로 */
export function protoLinkPageToPath(link: string | null | undefined): string | null {
  if (link == null || link === "") return null;
  const base = protoConfig.uiPrefix;
  const map: Record<string, string> = {
    dashboard: `${base}/dashboard`,
    "pm-assign": `${base}/pm-matching`,
    scoping: `${base}/scoping`,
    matching: `${base}/team-matching`,
    "team-mgmt": `${base}/team-mgmt`,
    "team-status": `${base}/team-mgmt`,
    inbox: `${base}/inbox`,
    notif: `${base}/notifications`,
  };
  return map[link] ?? null;
}

/** prototype notifications `link_page` → Next 내비 ID (`canSeeProtoNav` 와 함께 사용) */
export function protoLinkPageToNavId(link: string | null | undefined): ProtoShellNavId | null {
  if (link == null || link === "") return null;
  const map: Record<string, ProtoShellNavId> = {
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
