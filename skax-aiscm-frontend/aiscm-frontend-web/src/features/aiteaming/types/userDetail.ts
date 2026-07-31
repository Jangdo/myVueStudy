export interface AiTeamingUserProjectItem {
  pjtNo: string;
  pjtNm: string | null;
}

export interface AiTeamingUserDetail {
  usrId: string;
  usrNm: string | null;
  currAffltOrgId: string | null;
  currAffltOrgNm: string | null;
  bzuntOrgId: string | null;
  bzuntNm: string | null;
  dvsnOrgId: string | null;
  dvsnNm: string | null;
  hqOrgId: string | null;
  hqNm: string | null;
  pjtlist: AiTeamingUserProjectItem[];
}
