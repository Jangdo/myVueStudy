import type { AiteamingOrgTreeNode } from "@/features/aiteaming/types/orgs";
import type { ExcludeDivisionNode, ExcludeHeadNode, ExcludeTeamNode } from "./types";

export function mapAiteamingOrgsToExcludeTree(roots: AiteamingOrgTreeNode[]): ExcludeDivisionNode[] {
  return roots.map((node) => mapDivision(node));
}

function mapDivision(node: AiteamingOrgTreeNode): ExcludeDivisionNode {
  const heads: ExcludeHeadNode[] = (node.hqs ?? []).map((hq) => ({
    id: hq.orgId,
    label: hq.orgNm,
    checked: false,
    teams: (hq.bzunts ?? []).map(
      (bz): ExcludeTeamNode => ({
        id: bz.orgId,
        label: bz.orgNm,
        checked: false,
      }),
    ),
  }));

  return {
    id: node.orgId,
    label: node.orgNm,
    checked: false,
    heads,
  };
}

export function cloneExcludeTree(tree: ExcludeDivisionNode[]): ExcludeDivisionNode[] {
  return tree.map((d) => ({
    ...d,
    heads: d.heads.map((h) => ({
      ...h,
      teams: h.teams.map((t) => ({ ...t })),
    })),
  }));
}
