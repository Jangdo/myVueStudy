import type { HresourceDetailData, RecommendPjtJoin } from "@/features/aiteaming/types/hresource";
import type { RecommendProject, RecommendRow } from "@/features/aiteaming/components/project-detail/team/ai-recommend-modal/types";

type BadgeVariantPerson = "blue" | "blue2" | "violet" | "green";
type BadgeVariantProject = "blue2" | "violet" | "green";

export type SearchModalProjectCell = {
  title: string;
  statusLabel: string;
  statusVariant: BadgeVariantProject;
  statusAlert?: boolean;
  role: string;
  personName: string;
  periodMain: string;
  periodSub: string;
};

export type SearchModalTableRow = {
  id: string;
  personStatus: { label: string; variant: BadgeVariantPerson; alert?: boolean };
  person: {
    name: string;
    rank: string;
    team: string;
    empId?: string;
    role: string;
  };
  projects: SearchModalProjectCell[];
  moreProjectCount: number;
};

function formatIsoDot(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = String(iso).slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${y.slice(2)}.${m}.${day}`;
}

function personVariantFromDetail(d: HresourceDetailData): BadgeVariantPerson {
  const y = (d.currentAvailYn ?? "").trim().toUpperCase();
  if (y === "Y") return "blue";
  const nm = `${d.atvempStatTpNm ?? ""}`;
  if (/투입중|진행/.test(nm)) return "green";
  if (/확정/.test(nm)) return "violet";
  if (/예약|예정/.test(nm)) return "blue2";
  return "blue";
}

function projectStatusVariant(uiNm: string | null | undefined): BadgeVariantProject {
  const label = uiNm ?? "";
  if (/투입중|진행/.test(label)) return "green";
  if (/투입예약|예약|예정/.test(label)) return "blue2";
  if (/확정/.test(label)) return "violet";
  return "blue2";
}

function mapPjt(p: RecommendPjtJoin): SearchModalProjectCell {
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
    statusLabel: (p.agsnOngnStatUiNm ?? "—").trim() || "—",
    statusVariant: projectStatusVariant(p.agsnOngnStatUiNm),
    role: (p.roleNm ?? "—").trim() || "—",
    personName: (p.cndctPmEmpNm ?? "—").trim() || "—",
    periodMain: main,
    periodSub: sub,
  };
}

export function mapHresourceDetailToSearchRow(d: HresourceDetailData): SearchModalTableRow {
  const empNo = (d.empNo ?? "").trim() || "unknown";
  const pjtlist = d.pjtjoin ?? [];
  const cells = pjtlist.map(mapPjt);
  const visible = cells.slice(0, 2);
  const moreCount = Math.max(0, cells.length - 2);
  const firstRole = pjtlist[0]?.roleNm?.trim() || "—";

  return {
    id: empNo,
    personStatus: {
      label: (d.atvempStatTpNm ?? "—").trim() || "—",
      variant: personVariantFromDetail(d),
    },
    person: {
      name: (d.empNm ?? "—").trim() || "—",
      rank: (d.plvlTpNm ?? d.plvlTpCd ?? "—").trim() || "—",
      team: (d.currAffltOrgNm ?? "—").trim() || "—",
      empId: empNo || undefined,
      role: firstRole,
    },
    projects: visible,
    moreProjectCount: moreCount,
  };
}

/** 직접 검색 선택 → `applyRecommendSelectionToStaffingMember` 용 `RecommendRow` */
export function searchModalRowToRecommendRow(row: SearchModalTableRow, assignRole: string): RecommendRow {
  const role = assignRole.trim() || row.person.role || "—";
  const projects: RecommendProject[] = row.projects.map((p) => ({
    title: p.title,
    status: {
      label: p.statusLabel,
      variant: p.statusVariant,
      alert: p.statusAlert,
    },
    role: p.role,
    personName: p.personName,
    period: { main: p.periodMain, sub: p.periodSub },
  }));
  return {
    id: row.id,
    personStatus: row.personStatus,
    person: {
      ...row.person,
      role,
    },
    jobLine: "—",
    skillLine: "—",
    jobSkillItems: undefined,
    score: 0,
    reason: "—",
    projects,
  };
}
