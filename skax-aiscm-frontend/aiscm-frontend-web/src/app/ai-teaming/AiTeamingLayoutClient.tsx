"use client";

import type { ReactNode } from "react";
import { AiTeamingWorkspaceProvider } from "@/features/aiteaming/contexts/AiTeamingWorkspaceContext";
import type { WorkspaceTabCookiePayload } from "@/features/aiteaming/lib/workspaceTabCookie";

export function AiTeamingLayoutClient({
  children,
  initialWorkspaceTabs = null,
}: {
  children: ReactNode;
  initialWorkspaceTabs?: WorkspaceTabCookiePayload | null;
}) {
  return (
    <AiTeamingWorkspaceProvider initialWorkspaceTabs={initialWorkspaceTabs}>
      {children}
    </AiTeamingWorkspaceProvider>
  );
}
