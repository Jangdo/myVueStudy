import type { ProjectSummary } from "@/features/aiteaming/types/project";

/** `AiTeamingOpportunityCard` 섹션 표시용(서버에서 ProjectSummary → 문자열 매핑) */
export type AiTeamingOpportunityCardModel = {
  /** 상단 코드 (사업기회번호 우선) */
  opportunityCode: string;
  /** 상단 제목 (사업기회명 우선) */
  opportunityName: string;
  수행기간: string;
  프로젝트타입: string;
  고객사: string;
  /** 원화 금액 원시값(문자/숫자 문자열). 표시는 `formatKrwFullWon` 등으로 통일 */
  총사업예산: string;
  /** 원화 금액 원시값. 표시는 `formatKrwFullWon` */
  수주목표금액: string;
  수주귀속조직: string;
  영업대표: string;
  매출귀속조직: string;
};

function isBlank(v: string | null | undefined): boolean {
  return v == null || String(v).trim() === "";
}

/** `YYYY-MM-DD` 또는 ISO → `YYYY.MM.DD` */
function formatDotDate(isoOrLocal: string | null | undefined): string | null {
  if (isoOrLocal == null || String(isoOrLocal).trim() === "") return null;
  const s = String(isoOrLocal).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return `${m[1]}.${m[2]}.${m[3]}`;
  return s.replaceAll("-", ".");
}

/**
 * 원화를 세 자리 콤마 + `원`으로 표기 (정수 부분만).
 * - API 숫자·콤마 문자열
 * - 레거시 `formatKrwAmount` 축약 문자열 (`N억원`, `N만원`) — sessionStorage·구 캐시 호환
 */
export function formatKrwFullWon(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "—";
    return `${Math.trunc(value).toLocaleString("ko-KR")}원`;
  }

  const s = String(value).trim();
  if (s === "" || s === "—") return "—";

  const eok = /^([\d.]+)\s*억원?\s*$/u.exec(s);
  if (eok) {
    const n = Number(eok[1]) * 100_000_000;
    if (!Number.isFinite(n)) return "—";
    return `${Math.trunc(n).toLocaleString("ko-KR")}원`;
  }
  const man = /^([\d.]+)\s*만원?\s*$/u.exec(s);
  if (man) {
    const n = Number(man[1]) * 10_000;
    if (!Number.isFinite(n)) return "—";
    return `${Math.trunc(n).toLocaleString("ko-KR")}원`;
  }

  const plain = s.replace(/,/g, "").replace(/\s*원\s*$/u, "");
  const n = Number(plain);
  if (!Number.isFinite(n)) return "—";
  return `${Math.trunc(n).toLocaleString("ko-KR")}원`;
}

/** API 가 camelCase 또는 snake_case 로 금액을 줄 때 둘 다 수용 */
function pickSummaryAmt(
  summary: ProjectSummary | null,
  camel: "lbrcstBgtAmt" | "forcOritAmt",
): string | number | null | undefined {
  if (summary == null) return null;
  const row = summary as unknown as Record<string, unknown>;
  const snake = camel === "lbrcstBgtAmt" ? "lbrcst_bgt_amt" : "forc_orit_amt";
  const v = row[camel] ?? row[snake];
  if (v == null) return null;
  if (typeof v === "string" || typeof v === "number") return v;
  return null;
}

function firstNonBlankAmount(
  primary: string | number | null | undefined,
  fallback: string | number | null | undefined,
): string {
  if (primary != null && String(primary).trim() !== "") return String(primary);
  if (fallback != null && String(fallback).trim() !== "") return String(fallback);
  return "";
}

function amountToRawString(v: string | number | null | undefined): string {
  if (v == null || String(v).trim() === "") return "";
  return String(v);
}

/** 프로젝트 형태 라벨 (예: `SI` + `구축형` → `SI-구축형`) */
function formatProjectType(s: ProjectSummary | null): string {
  if (s == null) return "—";
  const cd = s.pjtFrmTpCd?.trim();
  const nm = s.pjtFrmTpNm?.trim();
  if (!isBlank(cd) && !isBlank(nm) && cd !== nm) return `${cd}-${nm}`;
  if (!isBlank(nm)) return nm!;
  if (!isBlank(cd)) return cd!;
  if (!isBlank(s.pjtClsfTpNm)) return String(s.pjtClsfTpNm);
  return "—";
}

/**
 * `GET .../projects/{pjtNo}/summary?view=summary|default` 의 `data` 를 카드 필드에 맞춘다.
 * - `pjtNo`: 라우트 `[projectCode]` 와 동일하게 전달 (예: `30133584-D001`)
 */
export function buildOpportunityCardModelFromSummary(
  summary: ProjectSummary | null,
  pjtNo: string,
): AiTeamingOpportunityCardModel {
  const start = formatDotDate(summary?.pjtStrtDt ?? null);
  const end = formatDotDate(summary?.pjtEndDt ?? null);
  let period = "—";
  if (start && end) period = `${start} ~ ${end}`;
  else if (start) period = `${start} ~`;
  else if (end) period = `~ ${end}`;

  const code =
    !isBlank(summary?.bizOpptyNo) ? String(summary!.bizOpptyNo) : !isBlank(summary?.pjtNo) ? String(summary!.pjtNo) : pjtNo;

  const title =
    !isBlank(summary?.bizOpptyNm) ? String(summary!.bizOpptyNm) : !isBlank(summary?.pjtNm) ? String(summary!.pjtNm) : "—";

  return {
    opportunityCode: code,
    opportunityName: title,
    수행기간: period,
    프로젝트타입: formatProjectType(summary),
    고객사: !isBlank(summary?.clntNm) ? String(summary!.clntNm) : "—",
    /** 인건비예산 — 없으면 예상수주 금액과 동일 원시값 */
    총사업예산: firstNonBlankAmount(pickSummaryAmt(summary, "lbrcstBgtAmt"), pickSummaryAmt(summary, "forcOritAmt")),
    /** `forcOritAmt` 예상수주금액 (원시값) */
    수주목표금액: amountToRawString(pickSummaryAmt(summary, "forcOritAmt")),
    수주귀속조직: !isBlank(summary?.oritAtrbOrgNm) ? String(summary!.oritAtrbOrgNm) : "—",
    영업대표: !isBlank(summary?.slsRpstEmpNm) ? String(summary!.slsRpstEmpNm) : "—",
    매출귀속조직: !isBlank(summary?.revnAtrbOrgNm) ? String(summary!.revnAtrbOrgNm) : "—",
  };
}
