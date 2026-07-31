/**
 * POST /api/v1/aiteaming/projects/{pjtNo}/matching/members?gubun=member
 * 백엔드 `RecommendMembersReq` 및 `ApiResponse<List<RecommendMembersBlockRes>>` JSON 에 대응
 */

/** 비어 있지 않은 필드만 포함 (빈 문자열 키는 JSON 에 넣지 않음) */
export type RecommendMembersSklstExcl = Partial<{
  sklstCd: string;
  jobCd: string;
  elmtSklNm: string;
}>;

export interface RecommendMembersOrgExcl {
  orgId: string;
}

export interface RecommendMembersWeight {
  wgtCd: string;
  wgtNm: string;
  bscVal: string;
}

/** GET /api/v1/aiteaming/matching/weights 응답 항목 — `RecommendMembersWeight` 와 동일 필드 */
export interface MatchingWeightRes {
  wgtCd?: string | null;
  wgtNm?: string | null;
  bscVal?: string | null;
}

/** GET /api/v1/aiteaming/matching/excluded-orgs 응답 항목 */
export interface MatchingExcludedOrgRes {
  orgGubunCd?: string | null;
  orgId?: string | null;
  orgNm?: string | null;
}

/** 보기 설정(5·10·15) — API `viewLimit` 와 동일. DB 저장은 추후 예정(현재 요청 파라미터만 사용). */
export type RecommendViewLimit = 5 | 10 | 15;

export interface RecommendMembersRequest {
  pjtRoleDmndId: string;
  sklstExcls?: RecommendMembersSklstExcl[];
  orgExcls?: RecommendMembersOrgExcl[];
  weights: RecommendMembersWeight[];
  /** 보기 설정 N명. 미전달 시 백엔드 기본(15). DB 반영 추후. */
  viewLimit?: RecommendViewLimit;
}

const DEFAULT_WEIGHTS: RecommendMembersWeight[] = [{ wgtCd: "50", wgtNm: "50", bscVal: "50" }];

/**
 * 저장 가중치 API 응답 → 매칭 요청 `weights` (유효한 `wgtCd`만 포함)
 */
export function mapMatchingWeightsToRecommendWeights(
  rows: MatchingWeightRes[] | null | undefined,
): RecommendMembersWeight[] {
  if (rows == null || rows.length === 0) return [];
  return rows
    .map((r) => ({
      wgtCd: (r.wgtCd ?? "").trim(),
      wgtNm: (r.wgtNm ?? "").trim(),
      bscVal: (r.bscVal ?? "").trim(),
    }))
    .filter((w) => w.wgtCd !== "")
    .map((w) => ({
      wgtCd: w.wgtCd,
      wgtNm: w.wgtNm || w.wgtCd,
      bscVal: w.bscVal || "0",
    }));
}

/**
 * 가중치 탭 슬라이더(0~100) → POST `weights` 1행.
 * `mapMatchingWeightsToRecommendWeights` 첫 행이 `recommendWeightsRowsToWeightState` 로 슬라이더에 반영되는 규약과 역방향.
 */
export function weightStateToRecommendMembersWeight(state: {
  orgPeople: number;
  skillMatch: number;
  similarHistory: number;
}): RecommendMembersWeight {
  const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
  return {
    wgtCd: String(clamp(state.orgPeople)),
    wgtNm: String(clamp(state.skillMatch)),
    bscVal: String(clamp(state.similarHistory)),
  };
}

function pickSklstItem(input: {
  sklstCd?: string | null;
  jobCd?: string | null;
  elmtSklNm?: string | null;
}): RecommendMembersSklstExcl | null {
  const o: RecommendMembersSklstExcl = {};
  const sc = input.sklstCd?.trim();
  const jc = input.jobCd?.trim();
  const en = input.elmtSklNm?.trim();
  if (sc) o.sklstCd = sc;
  if (jc) o.jobCd = jc;
  if (en) o.elmtSklNm = en;
  return Object.keys(o).length > 0 ? o : null;
}

/**
 * 요청 본문 조립: `pjtRoleDmndId`·기본 `weights` 필수.
 * `sklstExcls`: 항목마다 값 있는 키만 넣고, 유효 항목이 없으면 `sklstExcls` 키 자체 생략.
 * `orgExcls`: `orgId` 가 비어 있으면 해당 항목 제외, 남는 항목이 없으면 키 생략.
 */
export function buildRecommendMembersRequest(
  pjtRoleDmndId: string,
  options?: {
    weights?: RecommendMembersWeight[];
    sklstExcls?: Array<{ sklstCd?: string | null; jobCd?: string | null; elmtSklNm?: string | null }>;
    orgExcls?: Array<{ orgId?: string | null }>;
    /** 보기 설정(5/10/15). DB 저장 추후 — API 전달만. */
    viewLimit?: RecommendViewLimit;
  },
): RecommendMembersRequest {
  const id = pjtRoleDmndId.trim();
  if (!id) {
    throw new Error("pjtRoleDmndId가 필요합니다.");
  }

  const weights =
    options?.weights != null && options.weights.length > 0 ? [...options.weights] : [...DEFAULT_WEIGHTS];

  const body: RecommendMembersRequest = {
    pjtRoleDmndId: id,
    weights,
  };

  if (options?.sklstExcls?.length) {
    const items = options.sklstExcls.map(pickSklstItem).filter((x): x is RecommendMembersSklstExcl => x != null);
    if (items.length > 0) {
      body.sklstExcls = items;
    }
  }

  if (options?.orgExcls?.length) {
    const orgs = options.orgExcls
      .map((e) => e.orgId?.trim())
      .filter((x): x is string => Boolean(x))
      .map((orgId) => ({ orgId }));
    if (orgs.length > 0) {
      body.orgExcls = orgs;
    }
  }

  const vl = options?.viewLimit;
  if (vl === 5 || vl === 10 || vl === 15) {
    body.viewLimit = vl;
  }

  return body;
}

export interface RecommendRoleSklst {
  jobCd: string | null;
  jobNm: string | null;
  sklstCd: string | null;
  sklstNm: string | null;
}

export interface RecommendPjtJoin {
  pjtRoleDmndId?: string | null;
  prplMpSelctId?: number | null;
  pjtNo: string | null;
  pjtNm: string | null;
  cndctPmEmpNo?: string | null;
  cndctPmEmpNm?: string | null;
  roleCd?: string | null;
  roleNm?: string | null;
  agsnOngnStatTpCd?: string | null;
  agsnOngnStatUiNm?: string | null;
  rscrStrtDt?: string | null;
  rscrEndDt?: string | null;
  rscrTpCd?: string | null;
  rscrTpNm?: string | null;
  rscrMnh?: string | number | null;
  rscrMmth?: string | number | null;
  plvlTpCd?: string | null;
  plvlTpNm?: string | null;
}

export interface RecommendCandidate {
  empNo: string | null;
  empNm: string | null;
  goftScr?: string | number | null;
  rscrPsblStatTpCd?: string | null;
  rscrPsblStatTpNm?: string | null;
  rcmdRsnCntn?: string | null;
  sklsts?: RecommendRoleSklst[] | null;
  pjtlist?: RecommendPjtJoin[] | null;
}

export interface RecommendMembersBlock {
  pjtRoleDmndId?: string | null;
  tmgSeq?: number | null;
  tmgRqstId?: string | null;
  pjtNo?: string | null;
  roleCd?: string | null;
  roleNm?: string | null;
  rscrStrtDt?: string | null;
  rscrEndDt?: string | null;
  sklsts?: RecommendRoleSklst[] | null;
  candidates?: RecommendCandidate[] | null;
}

