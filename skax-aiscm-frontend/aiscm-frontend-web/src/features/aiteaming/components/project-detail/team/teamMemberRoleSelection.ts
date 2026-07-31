/**
 * 역할 수정 — 직무/스킬 선택
 * 저장 SSOT는 `selectedSkillIds`만. 직무 행은 스킬 선택 비율로 tri-state 표시.
 */

export interface JobLike {
  id: string;
  skills: { id: string }[];
}

export type JobSkillMap = Record<string, string[]>;

/** 직무 행 체크 표시: 미선택 / 일부 / 전부 */
export type JobTriState = "none" | "partial" | "all";

/**
 * 직무별 스킬 ID 목록 맵 (저장 시 jobCd 매핑 등에 사용)
 */
export function createJobSkillMap(jobOptions: JobLike[]): JobSkillMap {
  return jobOptions.reduce<JobSkillMap>((acc, job) => {
    acc[job.id] = job.skills.map((skill) => skill.id);
    return acc;
  }, {});
}

/**
 * 선택된 스킬 기준으로 직무 tri-state 계산.
 * 스킬이 한 직무에만 속한다는 도메인 전제.
 */
export function getJobTriState(job: JobLike, selectedSkillIds: readonly string[]): JobTriState {
  const ids = job.skills.map((s) => s.id);
  if (ids.length === 0) return "none";
  const set = new Set(selectedSkillIds);
  let count = 0;
  for (const id of ids) {
    if (set.has(id)) count += 1;
  }
  if (count === 0) return "none";
  if (count === ids.length) return "all";
  return "partial";
}

/**
 * 직무 체크박스 토글: 전부 선택된 경우만 해당 직무 스킬 전부 해제, 그 외에는 해당 직무 스킬 전부 선택.
 */
export function toggleJobSkills(
  jobId: string,
  jobOptions: JobLike[],
  selectedSkillIds: readonly string[],
): string[] {
  const job = jobOptions.find((j) => j.id === jobId);
  if (!job) return [...selectedSkillIds];
  const skillIds = job.skills.map((s) => s.id);
  const state = getJobTriState(job, selectedSkillIds);
  const next = new Set(selectedSkillIds);
  if (state === "all") {
    for (const id of skillIds) {
      next.delete(id);
    }
  } else {
    for (const id of skillIds) {
      next.add(id);
    }
  }
  return Array.from(next);
}
