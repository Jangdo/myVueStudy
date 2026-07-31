import type { ReactNode } from "react";
import { AiTeamingLayoutClient } from "./AiTeamingLayoutClient";

/** `output: 'export'` — 요청별 `cookies()` 불가. 탭 쿠키는 클라이언트에서 읽음(WorkspaceContext). */
export default function AiteamingLayout({ children }: { children: ReactNode }) {
  return (
    <AiTeamingLayoutClient initialWorkspaceTabs={null}>
      {children}
    </AiTeamingLayoutClient>
  );
}
