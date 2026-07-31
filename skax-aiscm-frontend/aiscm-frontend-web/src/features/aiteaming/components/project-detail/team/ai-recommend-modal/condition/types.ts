export type ConditionTab = "weight" | "constraint" | "exclude";
export type ViewCount = 5 | 10 | 15;
export type WeightKey = "orgPeople" | "skillMatch" | "similarHistory";

export interface WeightState {
  orgPeople: number;
  skillMatch: number;
  similarHistory: number;
}

export interface ExcludeTeamNode {
  id: string;
  label: string;
  checked: boolean;
}

export interface ExcludeHeadNode {
  id: string;
  label: string;
  checked: boolean;
  teams: ExcludeTeamNode[];
}

export interface ExcludeDivisionNode {
  id: string;
  label: string;
  checked: boolean;
  heads: ExcludeHeadNode[];
}

/** 제외 태그 1건 — `orgId` 가 API·`RecommendMembersOrgExcl` 과 동일 */
export type ExcludeTagItem = {
  tagKey: string;
  orgId: string;
  label: string;
  level: "division" | "head" | "team";
  divisionId: string;
  headId?: string;
  teamId?: string;
};

export interface ConditionDraftState {
  activeTab: ConditionTab;
  weight: WeightState;
  constraintLines: string[];
  excludeTree: ExcludeDivisionNode[];
  viewCount: ViewCount;
  prioritizeAvailable: boolean;
}
