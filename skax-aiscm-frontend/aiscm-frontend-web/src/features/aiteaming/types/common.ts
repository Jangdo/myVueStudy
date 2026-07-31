/** BC007 공통코드 조회 응답 한 행 */
export interface CommonCodeItem {
  cmmGrpCd: string;
  cmmGrpNm?: string | null;
  cmmGrpDescCntn?: string | null;
  grpUseYn?: boolean | null;
  cmmCdVal: string;
  cmmCdNm: string;
  cmmCdDescCntn?: string | null;
  useYn?: boolean | null;
}

export interface CommonRole {
  roleCd: string;
  roleNm: string;
}

export interface CommonSklst {
  sklstCd: string;
  sklstNm: string;
  jobCd: string;
  sklstRoleRespbCntn: string;
  sklstStrctTpCd: string;
  sklstStrctNm: string;
}

export interface CommonJobSklstBundle {
  jobCd: string;
  jobNm: string;
  jobRoleRespbCntn: string;
  jobStrctTpCd: string;
  jobStrctNm: string;
  sklsts: CommonSklst[];
}
