/** GET /api/v1/aiteaming/orgs — BC009 조직 트리 (부문 → 본부 hqs → 팀 bzunts) */

export interface AiteamingOrgBzuntNode {
  orgId: string;
  orgNm: string;
  uprOrgId: string;
}

export interface AiteamingOrgHqNode {
  orgId: string;
  orgNm: string;
  uprOrgId: string;
  bzunts?: AiteamingOrgBzuntNode[] | null;
}

export interface AiteamingOrgTreeNode {
  orgId: string;
  orgNm: string;
  uprOrgId: string;
  hqs?: AiteamingOrgHqNode[] | null;
}
