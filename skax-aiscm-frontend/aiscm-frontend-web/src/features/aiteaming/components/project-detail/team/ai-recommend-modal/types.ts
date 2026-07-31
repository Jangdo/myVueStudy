export type BadgeVariantPerson = "blue" | "blue2" | "violet" | "green";
export type BadgeVariantProject = "blue2" | "violet" | "green";

export interface RecommendProject {
  title: string;
  status: {
    label: string;
    variant: BadgeVariantProject;
    alert?: boolean;
  };
  role: string;
  personName: string;
  period: {
    main: string;
    sub: string;
  };
}

/** 후보 `sklsts` 1건 — 직무/스킬셋 카드 표시용 */
export interface RecommendJobSkillItem {
  jobLabel: string;
  skillLabel: string;
}

export interface RecommendRow {
  id: string;
  /** `postRecommendMembers` 블록 `tmgSeq` — 배정 `tmpSeq` 에 사용 */
  tmgSeq?: number | null;
  personStatus: {
    label: string;
    variant: BadgeVariantPerson;
    alert?: boolean;
  };
  person: {
    name: string;
    rank: string;
    team: string;
    empId?: string;
    role: string;
  };
  /** 요약 한 줄(배정 반영·하위 호환) */
  jobLine: string;
  skillLine: string;
  /** 복수 스킬셋 시 카드 분할 표시, 없으면 jobLine/skillLine 만 사용 */
  jobSkillItems?: RecommendJobSkillItem[];
  score: number;
  reason: string;
  projects: RecommendProject[];
}
