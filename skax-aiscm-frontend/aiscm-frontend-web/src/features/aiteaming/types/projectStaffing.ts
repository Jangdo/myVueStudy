/**
 * `GET /api/v1/aiteaming/projects/{pjtNo}/members/assign` 응답 `data.members[]` (ProjectMemberRes)
 */
export interface ProjectMemberSkill {
  jobCd: string | null;
  jobNm: string | null;
  sklstCd: string | null;
  sklstNm: string | null;
}

export interface ProjectMember {
  /** 프로젝트 역할 수요 ID — BC024·AI 추천 등 (응답 누락 시 undefined) */
  pjtRoleDmndId?: string | null;
  /** 수요인력선정상세 PK — 배정취소(미선정 행은 undefined) */
  prplMpSelctId?: number | null;
  agsnOngnStatTpCd: string | null;
  agsnOngnStatTpNm: string | null;
  agsnOngnStatUiNm: string | null;
  roleCd: string | null;
  roleNm: string | null;
  empNo: string | null;
  empNm: string | null;
  plvlTpCd: string | null;
  plvlTpNm: string | null;
  /** 투입구분코드(tb_pjt_role_dmnd_dtl) */
  rscrTpCd?: string | null;
  /** 공통코드명 — 없거나 불일치 시 화면 "—" */
  rscrTpNm?: string | null;
  schldRscrStrtDt: string | null;
  schldRscrEndDt: string | null;
  /** BC033: 백엔드 `rscr_mmth` (역할수요 투입 맨먼스) — MM 표기 원천 */
  rscr_mmth?: string | number | null;
  sumLbrcst: string | number | null;
  mmLbrcst: string | number | null;
  jobCmptCntn: string | null;
  empPicFileDir: string | null;
  sklsts?: ProjectMemberSkill[] | null;
}

/** ApiResponse.data — members 만 사용 */
export interface ProjectStaffingPayload {
  members: ProjectMember[];
}
