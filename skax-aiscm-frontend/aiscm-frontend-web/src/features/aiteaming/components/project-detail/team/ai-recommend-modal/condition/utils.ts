import type { RecommendMembersWeight } from "@/features/aiteaming/types/matchingMembers";
import type {
  ExcludeDivisionNode,
  ExcludeHeadNode,
  ExcludeTagItem,
  ExcludeTeamNode,
  WeightState,
} from "./types";

export type OrgTriState = "checked" | "unchecked" | "indeterminate";

function clampWeightPercent(raw: string): number {
  const n = Number(String(raw).replace(/,/g, "").trim());
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/**
 * GET /matching/weights → POST `weights` 첫 행을 UI 슬라이더에 반영.
 * 조직 내 인력 ← wgtCd, 스킬셋 매치 ← wgtNm, 유사 인력 ← bscVal (각 값을 0~100%로 파싱)
 */
export function recommendWeightsRowsToWeightState(rows: RecommendMembersWeight[]): WeightState | null {
  if (rows.length === 0) return null;
  const w = rows[0];
  return {
    orgPeople: clampWeightPercent(w.wgtCd),
    skillMatch: clampWeightPercent(w.wgtNm),
    similarHistory: clampWeightPercent(w.bscVal),
  };
}

export function getHeadTriState(head: ExcludeHeadNode): OrgTriState {
  const teams = head.teams;
  if (teams.length === 0) {
    return head.checked ? "checked" : "unchecked";
  }
  const checked = teams.filter((t) => t.checked).length;
  if (checked === 0) return "unchecked";
  if (checked === teams.length) return "checked";
  return "indeterminate";
}

export function getDivisionTriState(division: ExcludeDivisionNode): OrgTriState {
  const leaves = division.heads.flatMap((h) => h.teams);
  if (leaves.length > 0) {
    const checked = leaves.filter((t) => t.checked).length;
    if (checked === 0) return "unchecked";
    if (checked === leaves.length) return "checked";
    return "indeterminate";
  }
  /** Depth1만 존재(hqs/bzunts 없음): 부문 `checked`로 표시 */
  if (division.heads.length === 0) {
    return division.checked ? "checked" : "unchecked";
  }
  /** 본부만 있고 팀 없음: 본부 체크 상태로 tri-state */
  const headsChecked = division.heads.filter((h) => h.checked).length;
  if (headsChecked === 0) return "unchecked";
  if (headsChecked === division.heads.length) return "checked";
  return "indeterminate";
}

function syncHeadChecked(head: ExcludeHeadNode): ExcludeHeadNode {
  if (head.teams.length === 0) {
    return head;
  }
  const allChecked = head.teams.every((team) => team.checked);
  return { ...head, checked: allChecked };
}

function syncDivisionChecked(division: ExcludeDivisionNode): ExcludeDivisionNode {
  if (division.heads.length === 0) {
    return division;
  }
  const allChecked = division.heads.every((head) => head.checked);
  return { ...division, checked: allChecked };
}

export function toggleDivision(
  tree: ExcludeDivisionNode[],
  divisionId: string,
  checked: boolean,
): ExcludeDivisionNode[] {
  return tree.map((division) => {
    if (division.id !== divisionId) {
      return division;
    }
    return {
      ...division,
      checked,
      heads: division.heads.map((head) => ({
        ...head,
        checked,
        teams: head.teams.map((team) => ({ ...team, checked })),
      })),
    };
  });
}

export function toggleHead(
  tree: ExcludeDivisionNode[],
  divisionId: string,
  headId: string,
  checked: boolean,
): ExcludeDivisionNode[] {
  return tree.map((division) => {
    if (division.id !== divisionId) {
      return division;
    }

    const nextHeads = division.heads.map((head) => {
      if (head.id !== headId) {
        return head;
      }
      return {
        ...head,
        checked,
        teams: head.teams.map((team) => ({ ...team, checked })),
      };
    });

    return syncDivisionChecked({ ...division, heads: nextHeads.map(syncHeadChecked) });
  });
}

export function toggleTeam(
  tree: ExcludeDivisionNode[],
  divisionId: string,
  headId: string,
  teamId: string,
  checked: boolean,
): ExcludeDivisionNode[] {
  return tree.map((division) => {
    if (division.id !== divisionId) {
      return division;
    }
    const nextHeads = division.heads.map((head) => {
      if (head.id !== headId) {
        return head;
      }
      const nextTeams: ExcludeTeamNode[] = head.teams.map((team) =>
        team.id === teamId ? { ...team, checked } : team,
      );
      return syncHeadChecked({ ...head, teams: nextTeams });
    });

    return syncDivisionChecked({ ...division, heads: nextHeads });
  });
}

type OrgLocate =
  | { kind: "division"; divisionId: string }
  | { kind: "head"; divisionId: string; headId: string }
  | { kind: "team"; divisionId: string; headId: string; teamId: string };

/** 팀 → 본부 → 부문 순으로 매칭 (같은 id가 중복이면 가장 하위 노드). */
function locateOrgInTree(tree: ExcludeDivisionNode[], orgId: string): OrgLocate | null {
  const id = orgId.trim();
  if (!id) {
    return null;
  }
  for (const division of tree) {
    for (const head of division.heads) {
      for (const team of head.teams) {
        if (team.id === id) {
          return { kind: "team", divisionId: division.id, headId: head.id, teamId: team.id };
        }
      }
    }
    for (const head of division.heads) {
      if (head.id === id) {
        return { kind: "head", divisionId: division.id, headId: head.id };
      }
    }
    if (division.id === id) {
      return { kind: "division", divisionId: division.id };
    }
  }
  return null;
}

/**
 * 서버 `matching/excluded-orgs` 의 orgId 들을 제외 트리에 반영.
 * UI에서 체크 시와 동일하게 `toggleDivision` / `toggleHead` / `toggleTeam` 으로 전파한다.
 * 트리에 없는 id 는 무시.
 */
export function applyExcludedOrgIdsToTree(
  tree: ExcludeDivisionNode[],
  orgIds: Iterable<string>,
): ExcludeDivisionNode[] {
  const ids = [...new Set([...orgIds].map((x) => String(x).trim()).filter(Boolean))];
  if (ids.length === 0) {
    return tree;
  }
  let next = tree;
  for (const orgId of ids) {
    const loc = locateOrgInTree(next, orgId);
    if (loc == null) {
      continue;
    }
    if (loc.kind === "team") {
      next = toggleTeam(next, loc.divisionId, loc.headId, loc.teamId, true);
    } else if (loc.kind === "head") {
      next = toggleHead(next, loc.divisionId, loc.headId, true);
    } else {
      next = toggleDivision(next, loc.divisionId, true);
    }
  }
  return next;
}

function divisionHasAnyTeams(division: ExcludeDivisionNode): boolean {
  return division.heads.some((h) => h.teams.length > 0);
}

/**
 * 제외 선택을 태그로 평탄화 (orgId·라벨 표시용).
 *
 * - 부문에 하위(head) 없음: 부문만 선택 시 부문 `orgId`만.
 * - 본부만 있고 팀 없음: 부문 전체 또는 본부 전체 선택 시 **본부 orgId만** (부문 id 제외). 부분은 선택한 본부만.
 * - 팀이 있는 본부: 본부/부문 전체 또는 팀 전체 선택 시 **팀 orgId만** (본부 id 제외). 부분은 선택한 팀만.
 * - 혼합 트리: 팀 없는 본부는 본부 id, 팀 있는 본부는 팀 id 규칙 적용.
 */
export function flattenCheckedTagItems(tree: ExcludeDivisionNode[]): ExcludeTagItem[] {
  const items: ExcludeTagItem[] = [];

  for (const division of tree) {
    if (division.heads.length === 0) {
      if (division.checked) {
        items.push({
          tagKey: `org:${division.id}`,
          orgId: division.id,
          label: division.label,
          level: "division",
          divisionId: division.id,
        });
      }
      continue;
    }

    const anyTeams = divisionHasAnyTeams(division);

    if (!anyTeams) {
      const headsToTag = division.checked ? division.heads : division.heads.filter((h) => h.checked);
      for (const h of headsToTag) {
        items.push({
          tagKey: `org:${h.id}`,
          orgId: h.id,
          label: h.label,
          level: "head",
          divisionId: division.id,
          headId: h.id,
        });
      }
      continue;
    }

    for (const head of division.heads) {
      if (head.teams.length === 0) {
        if (division.checked || head.checked) {
          items.push({
            tagKey: `org:${head.id}`,
            orgId: head.id,
            label: head.label,
            level: "head",
            divisionId: division.id,
            headId: head.id,
          });
        }
        continue;
      }

      const includeAllTeams = division.checked || head.checked;
      const teamsToEmit = includeAllTeams ? head.teams : head.teams.filter((t) => t.checked);
      for (const t of teamsToEmit) {
        items.push({
          tagKey: `org:${t.id}`,
          orgId: t.id,
          label: t.label,
          level: "team",
          divisionId: division.id,
          headId: head.id,
          teamId: t.id,
        });
      }
    }
  }

  return items;
}

/** `RecommendMembersRequest.orgExcls` 용 — 위 태그 규칙과 동일한 orgId 목록(중복 제거) */
export function extractExcludedOrgIds(tree: ExcludeDivisionNode[]): string[] {
  const ids = flattenCheckedTagItems(tree).map((x) => x.orgId).filter((id) => id.trim() !== "");
  return [...new Set(ids)];
}

export function flattenCheckedLabels(tree: ExcludeDivisionNode[]): string[] {
  return Array.from(new Set(flattenCheckedTagItems(tree).map((item) => item.label)));
}

export function removeExcludeTagItem(
  tree: ExcludeDivisionNode[],
  item: ExcludeTagItem,
): ExcludeDivisionNode[] {
  if (item.level === "division") {
    return toggleDivision(tree, item.divisionId, false);
  }
  if (item.level === "head") {
    const headId = item.headId;
    if (headId == null) {
      return tree;
    }
    return toggleHead(tree, item.divisionId, headId, false);
  }
  const headId = item.headId;
  const teamId = item.teamId;
  if (headId == null || teamId == null) {
    return tree;
  }
  return toggleTeam(tree, item.divisionId, headId, teamId, false);
}
