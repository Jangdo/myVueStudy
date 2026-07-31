import { getAiteamingServerFetchBaseResolved } from "@/features/aiteaming/config";

/** Next 서버 → AI Teaming API fetch 타임아웃 */
export const AITEAMING_SERVER_FETCH_TIMEOUT_MS = 15_000;

export function getAiteamingServerFetchBase(): string {
  return getAiteamingServerFetchBaseResolved();
}
