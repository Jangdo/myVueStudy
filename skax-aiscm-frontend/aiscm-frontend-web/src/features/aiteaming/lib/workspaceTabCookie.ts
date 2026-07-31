/** SSR 첫 화면·hydration 일치용: sessionStorage는 서버에서 읽을 수 없어 탭 줄만 쿠키에 미러링 */

export const WORKSPACE_TAB_COOKIE_NAME = "aiteaming_ws_tabs_v1";

/** 레이아웃과 document.cookie 모두 동일 Path 사용 */
const COOKIE_PATH = "/aiteaming";

export type WorkspaceTabCookiePayload = {
  tabOrder: string[];
  tabTitles: Record<string, string>;
};

type Compact = { o: string[]; t: Record<string, string> };

function parseCompact(raw: unknown): WorkspaceTabCookiePayload | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = (raw as Compact).o;
  const t = (raw as Compact).t;
  if (!Array.isArray(o) || o.some((x) => typeof x !== "string")) return null;
  if (t == null || typeof t !== "object") return null;
  for (const k of Object.keys(t)) {
    if (typeof (t as Record<string, unknown>)[k] !== "string") return null;
  }
  return { tabOrder: o, tabTitles: t as Record<string, string> };
}

/** 서버·클라이언트 공통: 쿠키 원문 디코드 */
export function decodeWorkspaceTabCookie(raw: string | undefined): WorkspaceTabCookiePayload | null {
  if (raw == null || raw === "") return null;
  try {
    const json = decodeURIComponent(raw);
    const data = JSON.parse(json) as unknown;
    return parseCompact(data);
  } catch {
    return null;
  }
}

/** 정적 export 등 SSR 쿠키 없을 때: `document.cookie` 에서 탭 힌트만 읽기 */
export function readWorkspaceTabCookieFromDocument(): WorkspaceTabCookiePayload | null {
  if (typeof document === "undefined") return null;
  const prefix = `${WORKSPACE_TAB_COOKIE_NAME}=`;
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    if (part.startsWith(prefix)) {
      return decodeWorkspaceTabCookie(part.slice(prefix.length));
    }
  }
  return null;
}

const MAX_COOKIE_CHARS = 3800;

function encodePayload(order: string[], titles: Record<string, string>): string {
  const tryEncode = (t: Record<string, string>) =>
    encodeURIComponent(JSON.stringify({ o: order, t } satisfies Compact));

  let s = tryEncode(titles);
  if (s.length <= MAX_COOKIE_CHARS) return s;

  s = tryEncode({});
  if (s.length <= MAX_COOKIE_CHARS) return s;

  return tryEncode({});
}

/** 브라우저: 탭 줄만 쿠키에 기록(용량 초과 시 제목 생략). sessionStorage 본문과 별개 */
export function mirrorWorkspaceTabsToCookie(tabOrder: string[], tabTitles: Record<string, string>): void {
  if (typeof document === "undefined") return;
  if (tabOrder.length === 0) {
    clearWorkspaceTabCookie();
    return;
  }
  try {
    const v = encodePayload(tabOrder, tabTitles);
    document.cookie = `${WORKSPACE_TAB_COOKIE_NAME}=${v}; Path=${COOKIE_PATH}; Max-Age=604800; SameSite=Lax`;
  } catch {
    try {
      const v = encodePayload(tabOrder, {});
      document.cookie = `${WORKSPACE_TAB_COOKIE_NAME}=${v}; Path=${COOKIE_PATH}; Max-Age=604800; SameSite=Lax`;
    } catch {
      /* ignore */
    }
  }
}

export function clearWorkspaceTabCookie(): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${WORKSPACE_TAB_COOKIE_NAME}=; Path=${COOKIE_PATH}; Max-Age=0`;
  } catch {
    /* ignore */
  }
}
