import type {
  BadgeVariantPerson,
  BadgeVariantProject,
  RecommendJobSkillItem,
  RecommendProject,
  RecommendRow,
} from "@/features/aiteaming/components/project-detail/team/ai-recommend-modal/types";
import type { RecommendCandidate, RecommendMembersBlock, RecommendPjtJoin } from "@/features/aiteaming/types/matchingMembers";

function formatIsoDot(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = String(iso).slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${y.slice(2)}.${m}.${day}`;
}

function personStatusVariant(cd: string | null | undefined): BadgeVariantPerson {
  const n = (cd ?? "").trim();
  if (n === "02") return "blue2";
  if (n === "01") return "blue";
  return "blue";
}

function projectStatusVariant(
  uiNm: string | null | undefined,
  cd: string | null | undefined,
): BadgeVariantProject {
  const label = `${uiNm ?? ""} ${cd ?? ""}`;
  if (/투입중|진행/.test(label)) return "green";
  if (/투입예약|예약/.test(label)) return "blue2";
  if (/확정/.test(label)) return "violet";
  return "blue2";
}

function mapPjtToRecommendProject(p: RecommendPjtJoin): RecommendProject {
  const start = formatIsoDot(p.rscrStrtDt);
  const end = formatIsoDot(p.rscrEndDt);
  const main = start && end ? `${start} - ${end}` : start || end || "—";
  const mm = p.rscrMmth;
  const mmNum = mm === null || mm === undefined || mm === "" ? NaN : Number(mm);
  const sub =
    Number.isFinite(mmNum) && p.rscrTpNm
      ? `${p.rscrTpNm} · ${mmNum}MM`
      : Number.isFinite(mmNum)
        ? `${mmNum}MM`
        : (p.rscrTpNm ?? "—");

  return {
    title: (p.pjtNm ?? "—").trim() || "—",
    status: {
      label: (p.agsnOngnStatUiNm ?? "—").trim() || "—",
      variant: projectStatusVariant(p.agsnOngnStatUiNm, p.agsnOngnStatTpCd),
    },
    role: (p.roleNm ?? "—").trim() || "—",
    personName: (p.cndctPmEmpNm ?? "—").trim() || "—",
    period: { main, sub },
  };
}

function firstSkillLines(c: RecommendCandidate): { job: string; skill: string } {
  const list = c.sklsts ?? [];
  if (list.length === 0) return { job: "—", skill: "—" };
  const j = list.map((s) => s.jobNm?.trim()).filter(Boolean) as string[];
  const s = list.map((x) => x.sklstNm?.trim()).filter(Boolean) as string[];
  return {
    job: [...new Set(j)].join(", ") || "—",
    skill: [...new Set(s)].join(", ") || "—",
  };
}

/** API `sklsts` 행마다 직무·스킬셋 카드 1건 — `sklstNm` 없으면 제외 */
function mapSklstsToJobSkillItems(list: RecommendCandidate["sklsts"]): RecommendJobSkillItem[] {
  if (list == null || list.length === 0) return [];
  const out: RecommendJobSkillItem[] = [];
  for (const s of list) {
    const skillLabel = (s.sklstNm ?? "").trim();
    if (!skillLabel) continue;
    out.push({
      jobLabel: (s.jobNm ?? "—").trim() || "—",
      skillLabel,
    });
  }
  return out;
}

/** AI 추천점수(goftScr) 내림차순 정렬용 (비숫자·누락은 맨 뒤) */
function goftScrSortKey(c: RecommendCandidate): number {
  const scoreRaw = c.goftScr;
  const n = scoreRaw === null || scoreRaw === undefined || scoreRaw === "" ? NaN : Number(scoreRaw);
  return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY;
}

export function mapRecommendMembersBlockToRows(block: RecommendMembersBlock, assignRole: string): RecommendRow[] {
  const roleFallback = (block.roleNm ?? block.roleCd ?? assignRole).trim() || assignRole;
  const list = block.candidates ?? [];
  const sorted = [...list].sort((a, b) => {
    const db = goftScrSortKey(b);
    const da = goftScrSortKey(a);
    if (db !== da) {
      return db - da;
    }
    const eb = (b.empNo ?? "").trim();
    const ea = (a.empNo ?? "").trim();
    return ea.localeCompare(eb);
  });
  return sorted.map((c, index) => {
    const { job, skill } = firstSkillLines(c);
    const jobSkillItems = mapSklstsToJobSkillItems(c.sklsts);
    const scoreRaw = c.goftScr;
    const scoreNum = scoreRaw === null || scoreRaw === undefined || scoreRaw === "" ? NaN : Number(scoreRaw);
    const score = Number.isFinite(scoreNum) ? Math.round(scoreNum) : 0;
    const empNo = (c.empNo ?? "").trim() || `candidate-${index}`;

    return {
      id: empNo,
      tmgSeq: block.tmgSeq,
      personStatus: {
        label: (c.rscrPsblStatTpNm ?? "—").trim() || "—",
        variant: personStatusVariant(c.rscrPsblStatTpCd),
      },
      person: {
        name: (c.empNm ?? "—").trim() || "—",
        rank: "—",
        team: "—",
        empId: empNo || undefined,
        role: roleFallback,
      },
      jobLine: job,
      skillLine: skill,
      jobSkillItems: jobSkillItems.length > 0 ? jobSkillItems : undefined,
      score,
      reason: (c.rcmdRsnCntn ?? "—").trim() || "—",
      projects: (c.pjtlist ?? []).map(mapPjtToRecommendProject),
    };
  });
}
