import { Suspense } from "react";
import { AiTeamingProjectDetailPage } from "@/features/aiteaming/components/project-detail/AiTeamingProjectDetailPage";
import {
  getMockOpportunityCardModel,
  getMockStaffingMembers,
} from "@/features/aiteaming/mocks/projectDetail.mock";

/** `/pub/aiteaming/projects` 고정 미리보기 기본 코드 */
const PUB_PREVIEW_PROJECT_CODE = "D123";

export default function AiteamingProjectDetailPreviewRoute() {
  const opportunityCardModel = getMockOpportunityCardModel(PUB_PREVIEW_PROJECT_CODE);
  const staffingMembers = getMockStaffingMembers(PUB_PREVIEW_PROJECT_CODE);

  return (
    <Suspense fallback={null}>
      <AiTeamingProjectDetailPage
        projectCode={PUB_PREVIEW_PROJECT_CODE}
        opportunityCardModel={opportunityCardModel}
        opportunitySummaryError={null}
        docTabTitle={opportunityCardModel.opportunityName}
        staffingMembers={staffingMembers}
        staffingError={null}
        initialSummary={null}
        initialMembers={null}
        skipClientDataFetch
      />
    </Suspense>
  );
}
