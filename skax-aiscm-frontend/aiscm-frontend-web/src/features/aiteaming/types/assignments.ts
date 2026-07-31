/**
 * POST /api/v1/aiteaming/assignments?mpSelctTpCd=…
 * — `AssignmentRegisterReq` / `ApiResponse<AssignmentRegisterDataRes>`
 */

/** AI 추천 모달 — `mpSelctTpCd` (의미: 기존 라벨 「AI Teaming 선정」) */
export const AITEAMING_MP_SELCT_TP_AI_TEAMING = "1";

/** 직접 검색 모달 — `mpSelctTpCd` (의미: 기존 라벨 「직접입력선정」). 추후 `TeamMemberSearchModal` 연동 시 동일 상수 사용 */
export const AITEAMING_MP_SELCT_TP_DIRECT_INPUT = "2";

export interface AssignmentRegisterRequest {
  pjtRoleDmndId: string;
  empNo: string;
  /** 매칭 응답 `RecommendMembersBlock.tmgSeq` */
  tmpSeq?: number | null;
}

export interface AssignmentRegisterData {
  prplMpSelctId?: number | null;
}

/** POST /assignments/selections/delete */
export interface AssignmentSelectionsDeleteRequest {
  pjtNo: string;
  prplMpSelctIds: number[];
}

export function buildAssignmentRegisterRequest(
  pjtRoleDmndId: string,
  empNo: string,
  options?: { tmpSeq?: number | null },
): AssignmentRegisterRequest {
  const id = pjtRoleDmndId.trim();
  const emp = empNo.trim();
  if (!id) {
    throw new Error("pjtRoleDmndId가 필요합니다.");
  }
  if (!emp) {
    throw new Error("사원번호(empNo)가 필요합니다.");
  }
  const body: AssignmentRegisterRequest = { pjtRoleDmndId: id, empNo: emp };
  const seq = options?.tmpSeq;
  if (seq != null && Number.isFinite(Number(seq))) {
    body.tmpSeq = Number(seq);
  }
  return body;
}
