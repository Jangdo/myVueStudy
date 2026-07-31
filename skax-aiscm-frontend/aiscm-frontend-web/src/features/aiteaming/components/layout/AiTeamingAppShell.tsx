"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useAiTeamingWorkspaceOptional } from "@/features/aiteaming/contexts/AiTeamingWorkspaceContext";
import { AiTeamingLnb } from "../lnb/AiTeamingLnb";
import { AiTeamingRightSidebar } from "../right-sidebar/AiTeamingRightSidebar";
import type { ScmLnbType } from "../lnb/scmLnb.types";
import styles from "./AiTeamingAppShell.module.css";

export interface AiTeamingAppShellProps {
  children: ReactNode;
  /** 현재 프로젝트 `pjt_no` — LNB 하이라이트 (URL `projectCode`와 동일) */
  activeProjectCode?: string;
  /** Figma SCM_LNB `Type`: 영업 | 입찰 | 계약 | 수행 */
  scmLnbType?: ScmLnbType;
}

export function AiTeamingAppShell({
  children,
  activeProjectCode,
  scmLnbType = "영업",
}: AiTeamingAppShellProps) {
  const [lnbOpen, setLnbOpen] = useState(true);
  /** 요구사항: 최초 진입 시 우측 패널은 닫힘 */
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const workspace = useAiTeamingWorkspaceOptional();
  const resolvedActiveProjectCode = activeProjectCode ?? workspace?.activeProjectNo ?? undefined;

  return (
    <div className={styles.workspace}>
      <AiTeamingLnb
        activeProjectCode={resolvedActiveProjectCode}
        open={lnbOpen}
        onOpenChange={setLnbOpen}
        scmType={scmLnbType}
      />
      <div className={styles.mainColumn}>
        <div className={styles.mainFrame}>{children}</div>
      </div>
      <AiTeamingRightSidebar open={rightSidebarOpen} onOpenChange={setRightSidebarOpen} />
    </div>
  );
}
