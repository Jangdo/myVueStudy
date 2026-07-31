/** `HresourceDetailData.pjtjoin[]` — `RecommendPjtJoinRes` JSON */
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

/** GET /api/v1/aiteaming/hresources/list — data 페이로드 */
export interface HresourceSklstItem {
  sklstCd: string | null;
  sklstNm: string | null;
  sklstLvlNm: string | null;
  jobCd: string | null;
  jobNm: string | null;
}

export interface HresourceDetailData {
  empNo: string | null;
  empNm: string | null;
  currAffltOrgId: string | null;
  currAffltOrgNm: string | null;
  atvempStatTpCd: string | null;
  atvempStatTpNm: string | null;
  plvlTpCd: string | null;
  plvlTpNm: string | null;
  currentAvailYn: string | null;
  sklst: HresourceSklstItem[] | null;
  pjtjoin: RecommendPjtJoin[] | null;
}
