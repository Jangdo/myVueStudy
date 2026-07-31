/**
 * `GET /api/v1/aiteaming/projects/{pjtNo}/summary?view=summary|default` 응답 `data` (ProjectSummaryRes)
 * 일부 필드는 DB/API 에 따라 null 일 수 있음.
 */
export interface ProjectSummary {
  pjtNo: string;
  pjtNm: string | null;
  bizOpptyNo: string | null;
  bizOpptyNm: string | null;
  pjtClsfTpCd: string | null;
  pjtClsfTpNm: string | null;
  itrExtlTpCd?: string | null;
  itrExtlTpNm?: string | null;
  clntId?: number | null;
  clntNm?: string | null;
  pjtStrtDt: string | null;
  pjtEndDt: string | null;
  oritProb?: string | number | null;
  lbrcstBgtAmt?: string | number | null;
  rscrLbrcstAmt?: string | number | null;
  revnAtrbOrgId?: string | null;
  revnAtrbOrgNm?: string | null;
  slsRpstEmpNo?: string | null;
  /** BC016 영업대표직원명 */
  slsRpstEmpNm?: string | null;
  oritAtrbOrgId?: string | null;
  oritAtrbOrgNm?: string | null;
  pmAgsnYn?: boolean | null;
  cndctPmEmpNo?: string | null;
  cndctPmEmpNm?: string | null;
  indsClsfStrctCd?: string | null;
  indsClsfStrctNm?: string | null;
  pjtStatTpCd?: string | null;
  pjtStatTpNm?: string | null;
  pjtFrmTpCd?: string | null;
  pjtFrmTpNm?: string | null;
  forcOritAmt?: string | number | null;
  totForcRscrEffrt?: string | number | null;
  sumDmndMm?: string | number | null;
  rscrMm?: string | number | null;
  nonRscrMm?: string | number | null;
  rscrCnfirmHdcnt?: string | number | null;
}
