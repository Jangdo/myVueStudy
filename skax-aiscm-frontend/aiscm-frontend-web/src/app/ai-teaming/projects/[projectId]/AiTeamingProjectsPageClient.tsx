"use client";

import { Suspense, useEffect } from "react";
import { useAiTeamingWorkspace } from "@/features/aiteaming/contexts/AiTeamingWorkspaceContext";
import { buildOpportunityCardModelFromSummary } from "@/features/aiteaming/lib/opportunityCardModel";
import { AiTeamingProjectDetailPage } from "@/features/aiteaming/components/project-detail/AiTeamingProjectDetailPage";
import styles from "./AiTeamingProjectsPageClient.module.css";

const DEFAULT_EMP_NO = "10631";

interface AiTeamingProjectsPageClientProps {
  /** 동적 세그먼트 `/ai-teaming/projects/[projectId]`로부터 전달된 프로젝트 ID */
  projectId?: string;
}

export function AiTeamingProjectsPageClient({
  projectId,
}: AiTeamingProjectsPageClientProps = {}) {
  const { initializeWorkspace, workspaceLoading, workspaceError } = useAiTeamingWorkspace();

  useEffect(() => {
    void initializeWorkspace(DEFAULT_EMP_NO);
  }, [initializeWorkspace]);

  return (
    <>
      <Suspense fallback={null}>
        <AiTeamingProjectDetailPage
          projectCode={projectId ?? ""}
          opportunityCardModel={buildOpportunityCardModelFromSummary(null, "—")}
          opportunitySummaryError={null}
          docTabTitle={null}
          staffingMembers={[]}
          staffingError={null}
          initialSummary={null}
          initialMembers={null}
        />
      </Suspense>

      {workspaceLoading ? (
        <div className={styles.overlay} role="status" aria-live="polite" aria-label="워크스페이스 로딩 중">
          <div className={styles.overlayCard}>
            <span className={styles.spinner} aria-hidden />
            <span className={styles.message}>워크스페이스를 불러오는 중입니다.</span>
          </div>
        </div>
      ) : null}

      {workspaceError != null ? (
        <div className={styles.overlay} role="alert" aria-live="assertive">
          <div className={styles.errorCard}>
            <p className={styles.errorTitle}>워크스페이스 로딩 실패</p>
            <p className={styles.errorMessage}>{workspaceError}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
