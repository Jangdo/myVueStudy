export interface ProjectRoleSkill {
  pjtRoleDmndId: string;
  sklstCd: string;
  sklstNm: string;
  jobCd: string;
  elmtSklNm: string | null;
}

export interface ProjectRoleDetail {
  pjtRoleDmndId: string;
  pjtNo: string;
  dmndTpCd: string;
  plvlTpCd: string;
  roleCd: string;
  roleNm: string;
  rscrStrtDt: string;
  rscrEndDt: string;
  rscrTpCd: string;
  rscrTpNm: string | null;
  rscrMnh: string | number | null;
  rscrMmth: string | number | null;
  jobCmptCntn: string | null;
  rscrHdcnt: string | number | null;
  mpAgsnStatTpCd: string | null;
  mpAgsnStatTpNm: string | null;
  sklst: ProjectRoleSkill[];
}

export interface ProjectRoleSkillSave {
  sklstCd: string;
  jobCd: string;
  elmtSklNm: string;
}

export interface ProjectRoleSaveRequest {
  pjtRoleDmndId: string;
  pjtNo: string;
  dmndTpCd: string;
  plvlTpCd: string;
  roleCd: string;
  rscrStrtDt: string;
  rscrEndDt: string;
  rscrTpCd: string;
  rscrMnh: number;
  rscrMmth: number;
  jobCmptCntn: string;
  rscrHdcnt: number;
  mpAgsnStatTpCd?: string | null;
  sklsts: ProjectRoleSkillSave[];
}

export interface ProjectRoleSaveResult {
  pjtRoleDmndId: string;
}
