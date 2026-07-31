import type { ProjectMember } from "@/features/aiteaming/types/projectStaffing";
import type { RecommendRow } from "@/features/aiteaming/components/project-detail/team/ai-recommend-modal/types";

export type BadgeVariant = "green" | "gray" | "blue" | "orange" | "red" | "teal";

/** 투입인력 테이블 한 줄 — API `ProjectMember`를 화면 표시용으로 변환한 모델 */
export interface AiTeamingStaffingMember {
  id: string;
  role: string;
  /** 역할 수요 ID — AI 추천 API 등 (응답에 없으면 미설정) */
  pjtRoleDmndId?: string | null;
  /** `agsnOngnStatTpCd` 원본 — 배정 POST 등 */
  agsnOngnStatTpCd?: string | null;
  /** 예정 투입 시작·종료(ISO `yyyy-MM-dd` 가능) — 배정 POST 등 */
  schldRscrStrtDt?: string | null;
  schldRscrEndDt?: string | null;
  /** `agsnOngnStatTpCd` 정규화값 — 탭 필터 (구버전 캐시에는 누락될 수 있음) */
  statCdNorm?: string;
  status: { label: string; variant: BadgeVariant; alert?: boolean };
  person?: { name: string; rank: string; team: string; empId?: string };
  unassigned?: boolean;
  skill: {
    /** 직무명 — 유니크 후 `, ` 구분 */
    jobLine: string;
    /** 스킬셋명 — 카드(칩) 목록(순서 유지) */
    skillLabels: string[];
  };
  /** 직무역량·제약조건 원문 — `ProjectMember.jobCmptCntn` */
  jobCmptCntn?: string | null;
  competency: string[];
  period: { main: string; sub: string };
  amount: { main: string; sub: string };
  /** 수요인력선정 PK — 배정취소(없으면 미선정·TBD 행) */
  prplMpSelctId?: number | null;
  /** 역할 수요 P등급(미배정 등급지정·배정 후 표시 일원화에 사용) */
  plvlTpCd?: string | null;
  plvlTpNm?: string | null;
}

const TABS = ["전체", "투입가능", "투입예정", "투입불가", "미배정"] as const;

export type TeamMemberTab = (typeof TABS)[number];

export const TEAM_MEMBER_TABS: readonly TeamMemberTab[] = TABS;

/** API 코드 비교용: trim + 소문자 + `_` → `-` */
export function normalizeAssignmentStatCd(cd: string | null | undefined): string {
  return (cd ?? "").trim().toLowerCase().replace(/_/g, "-");
}

function statusFromStatCd(norm: string): { label: string; variant: BadgeVariant; alert?: boolean } {
  if (!norm) return { label: "—", variant: "gray" };
  if (norm === "unassigned" || norm === "soft-booked") {
    return { label: "투입가능", variant: "green" };
  }
  if (norm === "hard-booked") {
    return { label: "투입예정", variant: "orange" };
  }
  if (norm === "assigned") {
    return { label: "투입불가", variant: "red", alert: true };
  }
  if (norm === "tbd") {
    return { label: "미배정", variant: "gray" };
  }
  return { label: norm, variant: "gray" };
}

function formatDateDot(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = String(iso).slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${y.slice(2)}.${m}.${day}`;
}

function formatKrw(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (Number.isNaN(n)) return "—";
  return `${Math.round(n).toLocaleString("ko-KR")}`;
}

/** 투입구분명 우측에 `NMM` — API `rscr_mmth`만 사용 */
function formatPeriodSubLine(
  rscrTpNm: string | null | undefined,
  rscrMmth: string | number | null | undefined,
): string {
  const raw = rscrMmth;
  const mmNum = raw === null || raw === undefined || raw === "" ? NaN : Number(raw);
  if (!Number.isFinite(mmNum)) {
    return "—";
  }
  const label = (rscrTpNm ?? "").trim() || "—";
  return `${label} ${mmNum}MM`;
}

/** `ProjectMember.jobCmptCntn` — 줄바꿈/세미콜론 분리 (비어 있으면 `["—"]`) */
export function jobCmptCntnToConstraintLines(jobCmptCntn: string | null | undefined): string[] {
  if (jobCmptCntn == null || String(jobCmptCntn).trim() === "") return ["—"];
  return String(jobCmptCntn)
    .split(/\r?\n|;/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** BC033 `sklsts` — 직무는 `, ` 구분 한 줄, 스킬은 카드용 배열 */
function skillFromMember(m: ProjectMember): { jobLine: string; skillLabels: string[] } {
  const list = m.sklsts ?? [];
  if (list.length === 0) return { jobLine: "—", skillLabels: [] };

  const jobNms = list
    .map((s) => s.jobNm?.trim())
    .filter((x): x is string => Boolean(x));
  const sklstNms = list
    .map((s) => s.sklstNm?.trim())
    .filter((x): x is string => Boolean(x));

  const jobLine = [...new Set(jobNms)].join(", ") || "—";
  const seen = new Set<string>();
  const skillLabels = sklstNms.filter((nm) => {
    if (seen.has(nm)) return false;
    seen.add(nm);
    return true;
  });
  return { jobLine, skillLabels };
}

function isTbdAssignmentStatus(m: Pick<ProjectMember, "agsnOngnStatTpCd">): boolean {
  return normalizeAssignmentStatCd(m.agsnOngnStatTpCd) === "tbd";
}

/** 배정 인력 칼럼: emp 미지정이거나 TBD(미배정)면 AI 추천·검색 UI */
function isUnassignedPersonColumn(m: ProjectMember): boolean {
  return !m.empNo?.trim() || isTbdAssignmentStatus(m);
}

/** BC033 `ProjectMember` → 투입인력 테이블 표시 모델 */
export function mapProjectMemberToStaffingMember(m: ProjectMember, index: number): AiTeamingStaffingMember {
  const statCdNorm = normalizeAssignmentStatCd(m.agsnOngnStatTpCd);
  const unassigned = isUnassignedPersonColumn(m);
  const start = formatDateDot(m.schldRscrStrtDt);
  const end = formatDateDot(m.schldRscrEndDt);
  const periodMain =
    start && end ? `${start} - ${end}` : start || end ? `${start || "—"} - ${end || "—"}` : "—";
  const periodSub = formatPeriodSubLine(m.rscrTpNm, m.rscr_mmth);

  const sum = formatKrw(m.sumLbrcst);
  const mmCost = formatKrw(m.mmLbrcst);
  const amountMain = sum === "—" ? "—" : sum;
  const amountSub = mmCost === "—" ? "—" : `M/M | ${mmCost}`;

  const pjtRoleDmndIdRaw = m.pjtRoleDmndId?.trim() || null;
  const prplId = m.prplMpSelctId;
  /** 선정 행은 prpl 기준 고유 ID(동일 역할수요에 복수 선정 가능) */
  const memberId =
    prplId != null && Number.isFinite(Number(prplId))
      ? `sel-${prplId}`
      : (pjtRoleDmndIdRaw ?? `${m.roleCd ?? "role"}-${m.empNo ?? "na"}-${index}`);

  const member: AiTeamingStaffingMember = {
    id: memberId,
    role: (m.roleNm || m.roleCd || "—").trim(),
    pjtRoleDmndId: pjtRoleDmndIdRaw,
    prplMpSelctId: prplId ?? null,
    plvlTpCd: m.plvlTpCd?.trim() || null,
    plvlTpNm: m.plvlTpNm?.trim() || null,
    agsnOngnStatTpCd: m.agsnOngnStatTpCd,
    schldRscrStrtDt: m.schldRscrStrtDt,
    schldRscrEndDt: m.schldRscrEndDt,
    statCdNorm,
    status: statusFromStatCd(statCdNorm),
    skill: skillFromMember(m),
    jobCmptCntn: m.jobCmptCntn,
    competency: jobCmptCntnToConstraintLines(m.jobCmptCntn),
    period: { main: periodMain, sub: periodSub },
    amount: { main: amountMain, sub: amountSub },
  };

  if (unassigned) {
    member.unassigned = true;
  } else {
    member.person = {
      name: (m.empNm || "—").trim(),
      rank: (m.plvlTpCd || m.plvlTpNm || "—").trim(),
      team: "—",
      empId: m.empNo?.trim() || undefined,
    };
  }

  return member;
}

export function memberMatchesTeamTab(tab: TeamMemberTab, m: ProjectMember): boolean {
  const c = normalizeAssignmentStatCd(m.agsnOngnStatTpCd);
  if (tab === "전체") return true;
  if (tab === "투입가능") return c === "unassigned" || c === "soft-booked";
  if (tab === "투입예정") return c === "hard-booked";
  if (tab === "투입불가") return c === "assigned";
  if (tab === "미배정") return c === "tbd";
  return true;
}

/** 클라이언트 탭 필터 — `memberMatchesTeamTab` 과 동일 규칙 (`agsnOngnStatTpCd`) */
export function staffingMemberMatchesTab(tab: TeamMemberTab, member: AiTeamingStaffingMember): boolean {
  const c = member.statCdNorm ?? "";
  if (tab === "전체") return true;
  if (tab === "투입가능") return c === "unassigned" || c === "soft-booked";
  if (tab === "투입예정") return c === "hard-booked";
  if (tab === "투입불가") return c === "assigned";
  if (tab === "미배정") return c === "tbd";
  return true;
}

const LABOR_FOOTER_HINT = "반려된 인력의 인건비를 제외한 합계입니다.";

/** RSC/목업 표시 모델에서 푸터 금액 라벨만 추정(숫자 파싱). API `laborFooterFromMembers` 가 정확함. */
export function laborTotalLabelFromStaffingMembers(members: AiTeamingStaffingMember[]): {
  totalAmount: string;
  hint: string;
} {
  let sum = 0;
  for (const r of members) {
    const raw = r.amount?.main;
    if (raw == null || raw === "" || raw === "—") continue;
    const n = Number(String(raw).replace(/[^\d.-]/g, ""));
    if (Number.isFinite(n)) sum += n;
  }
  const totalAmount = sum > 0 ? `${Math.round(sum).toLocaleString("ko-KR")}원` : "—";
  return { totalAmount, hint: LABOR_FOOTER_HINT };
}

/** AI 추천에서 선택한 인력으로 배정 인력·스킬 컬럼을 채우고 투입예정으로 표시 */
export function applyRecommendSelectionToStaffingMember(
  member: AiTeamingStaffingMember,
  selected: RecommendRow,
): AiTeamingStaffingMember {
  const rank =
    selected.person.rank && selected.person.rank !== "—"
      ? selected.person.rank
      : (member.person?.rank ?? "—");
  return {
    ...member,
    unassigned: undefined,
    person: {
      name: selected.person.name,
      rank,
      team: selected.person.team || member.person?.team || "—",
      empId: selected.person.empId,
    },
    skill: (() => {
      const items = selected.jobSkillItems;
      if (items != null && items.length > 0) {
        const jobLabels = items
          .map((i) => (i.jobLabel ?? "").trim())
          .filter(Boolean);
        const jobLine =
          [...new Set(jobLabels)].join(", ") ||
          (selected.jobLine?.trim() || member.skill.jobLine);
        const rawSkills = items
          .map((i) => (i.skillLabel ?? "").trim())
          .filter(Boolean);
        const seen = new Set<string>();
        const skillLabels = rawSkills.filter((s) => {
          if (seen.has(s)) return false;
          seen.add(s);
          return true;
        });
        if (skillLabels.length > 0) {
          return { jobLine: jobLine || "—", skillLabels };
        }
        const fromLine = selected.skillLine
          ?.split(/,\s*/)
          .map((s) => s.trim())
          .filter(Boolean);
        return {
          jobLine: jobLine || "—",
          skillLabels: fromLine?.length ? fromLine : member.skill.skillLabels,
        };
      }
      const jobLine = selected.jobLine?.trim() || member.skill.jobLine;
      const fromLine = selected.skillLine
        ?.split(/,\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        jobLine,
        skillLabels: fromLine?.length ? fromLine : member.skill.skillLabels,
      };
    })(),
    statCdNorm: "hard-booked",
    status: { label: "투입예정", variant: "orange" },
  };
}
