import type { ConditionDraftState } from "./types";

export const INITIAL_CONDITION_DRAFT: ConditionDraftState = {
  activeTab: "weight",
  weight: {
    orgPeople: 50,
    skillMatch: 20,
    similarHistory: 30,
  },
  constraintLines: [
    "최근 5년 내 신규 사업 또는 신제품 기획 프로젝트 2회 이상 참여",
    "시장/경쟁 분석 리포트 작성 경험 3건 이상",
  ],
  excludeTree: [],
  viewCount: 15,
  prioritizeAvailable: true,
};
