"use client";

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { coerceStringList } from "@/features/proto/lib/coerceStringList";
import { roleFromUserKey } from "@/features/proto/lib/roleFromUserKey";
import { ProtoProjectDropdown, type ProtoProjectOption } from "@/features/proto/components/shared/ProtoProjectDropdown";
import { ProtoLoadingOverlay } from "@/features/proto/components/shared/ProtoLoadingOverlay";
import { ProtoTeamMgmtModal } from "@/features/proto/components/team-mgmt/ProtoTeamMgmtModal";
import { protoCommandService } from "@/features/proto/services/protoCommandService";
import { protoQueryService } from "@/features/proto/services/protoQueryService";
import { useProtoSessionUserKey } from "@/features/proto/lib/useProtoSessionUserKey";
import "@/features/proto/styles/team-mgmt/team-mgmt-parity.css";

type CandidateRow = Record<string, unknown>;

type ProjectRow = Record<string, unknown> & { id: number; name?: string };

type RoleRow = {
  id: number;
  roleName?: string;
  level?: string;
  quantity?: number;
  filled?: number;
  monthlyCost?: number;
  required_mm?: number;
  required_skills?: unknown;
};

type TeamView = Record<string, unknown>;
type CostView = Record<string, unknown>;
type MatchTeamResponse = {
  candidates?: CandidateRow[];
  project?: Record<string, unknown>;
  role?: Record<string, unknown>;
};

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** API가 객체/단일 값으로 내려줄 때 for..of·filter가 깨지지 않도록 배열만 통과 */
function asRecordArray(v: unknown): Array<Record<string, unknown>> {
  if (v == null) return [];
  if (Array.isArray(v)) return v as Array<Record<string, unknown>>;
  return [];
}

function parseSkills(s: string): string[] {
  return s
    .split(/[,;]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function normalizeSkillArray(sk: unknown): string[] {
  if (sk == null) return [];
  if (Array.isArray(sk)) {
    return sk.map(String).map((x) => x.trim()).filter(Boolean);
  }
  if (typeof sk === "string") {
    const t = sk.trim();
    if (!t) return [];
    try {
      const p = JSON.parse(t) as unknown;
      if (Array.isArray(p)) {
        return p.map(String).map((x) => x.trim()).filter(Boolean);
      }
    } catch {
      /* not JSON */
    }
    return parseSkills(t);
  }
  return [];
}

function skillsToText(sk: unknown): string {
  return normalizeSkillArray(sk).join(", ");
}

function formatWon(n: number): string {
  return `₩${Math.round(n).toLocaleString("ko-KR")}`;
}

function teamMetaBadge(p: ProjectRow): { label: string; cls: ProtoProjectOption["badgeClass"] } {
  const pm = str(p.pmName);
  const pct = num(p.teamCompositionPct);
  if (!pm) {
    return { label: "PM 미배정", cls: "orange" };
  }
  if (pct > 0 && pct < 100) {
    return { label: "팀 구성 진행중", cls: "yellow" };
  }
  if (pct >= 100) {
    return { label: "팀 구성 완료", cls: "green" };
  }
  return { label: "팀 구성 진행중", cls: "yellow" };
}

function isPmOnlySyntheticRole(role: Record<string, unknown>): boolean {
  if (str(role.roleName) !== "Project Manager") {
    return false;
  }
  const ads = asRecordArray(role.assignments);
  if (ads.length === 0) {
    return false;
  }
  return ads.every((a) => String(a.assignmentType ?? "").toLowerCase() === "pm");
}

function collectPmAssignments(rolesArr: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  for (const r of rolesArr) {
    const ads = asRecordArray(r.assignments);
    for (const a of ads) {
      if (String(a.assignmentType ?? "").toLowerCase() === "pm") {
        out.push(a);
      }
    }
  }
  return out;
}

type ProtoTeamNavId = "scoping" | "pm-matching";

export default function ProtoTeamManagementPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qpProjectId = searchParams.get("projectId");
  const userKey = useProtoSessionUserKey();
  const requesterRole = roleFromUserKey(userKey).toUpperCase();

  const navigateProto = useCallback(
    (id: ProtoTeamNavId, options?: { projectId?: number }) => {
      if (id === "scoping") {
        const q = options?.projectId != null ? `?projectId=${options.projectId}` : "";
        router.push(`/proto/scoping${q}`);
        return;
      }
      if (id === "pm-matching") {
        router.push("/proto/pm-matching");
      }
    },
    [router],
  );
  const isAM = requesterRole === "AM";
  const isPM = requesterRole === "PM";

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [projectId, setProjectId] = useState("");
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [team, setTeam] = useState<TeamView | null>(null);
  const [cost, setCost] = useState<CostView | null>(null);
  const [busy, setBusy] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchRoleId, setMatchRoleId] = useState<number | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<MatchTeamResponse | null>(null);
  const [matchAvailability, setMatchAvailability] = useState(0.5);
  const [matchSkill, setMatchSkill] = useState(0.3);
  const [matchHistory, setMatchHistory] = useState(0.2);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRow | null>(null);
  const [proposingId, setProposingId] = useState<number | null>(null);
  const [expandedCandidateId, setExpandedCandidateId] = useState<number | null>(null);

  const [roleName, setRoleName] = useState("Developer");
  const [level, setLevel] = useState("CL3");
  const [quantity, setQuantity] = useState("1");
  const [monthlyCost, setMonthlyCost] = useState("0");
  const [requiredMm, setRequiredMm] = useState("1");
  const [skillsText, setSkillsText] = useState("");

  const loadProjects = useCallback(async () => {
    setError(null);
    setProjectsLoading(true);
    try {
      const list = await protoQueryService.getProjects(userKey);
      setProjects((Array.isArray(list) ? list : []) as unknown as ProjectRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }, [userKey]);

  const refreshAll = useCallback(async (pid: string) => {
    if (!pid) {
      setRoles([]);
      setTeam(null);
      setCost(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const [t, c] = await Promise.all([
        protoQueryService.getProjectTeam(Number(pid)),
        protoQueryService.getProjectCost(Number(pid)),
      ]);
      setTeam(t as unknown as TeamView);
      setCost(c as unknown as CostView);
      const roleRows = Array.isArray(t.roles) ? (t.roles as RoleRow[]) : [];
      setRoles(roleRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const resetForm = useCallback(() => {
    setEditingRoleId(null);
    setRoleName("Developer");
    setLevel("CL3");
    setQuantity("1");
    setMonthlyCost("0");
    setRequiredMm("1");
    setSkillsText("");
  }, []);

  const hydrateForm = useCallback((r: RoleRow) => {
    setEditingRoleId(r.id);
    setRoleName(String(r.roleName ?? ""));
    setLevel(String(r.level ?? "CL3"));
    setQuantity(String(r.quantity ?? 1));
    setMonthlyCost(String(r.monthlyCost ?? 0));
    setRequiredMm(String(r.required_mm ?? 1));
    setSkillsText(skillsToText(r.required_skills));
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (projects.length === 0) {
      setProjectId("");
      return;
    }

    if (qpProjectId != null && qpProjectId !== "") {
      if (projects.some((p) => String(p.id) === qpProjectId)) {
        setProjectId(qpProjectId);
        return;
      }
    }

    setProjectId((prev) => {
      if (prev && projects.some((p) => String(p.id) === prev)) {
        return prev;
      }
      return String(projects[0].id);
    });
  }, [projects, qpProjectId]);

  useEffect(() => {
    if (!projectId) return;
    resetForm();
    void refreshAll(projectId);
  }, [projectId, refreshAll, resetForm]);

  const saveRole = async () => {
    if (!projectId) return;
    setBusy(true);
    setError(null);
    try {
      const skillsJson = JSON.stringify(parseSkills(skillsText));
      if (editingRoleId != null) {
        await protoCommandService.updateProjectRole(Number(projectId), editingRoleId, {
          roleName: roleName,
          level,
          quantity: Number(quantity) || 1,
          monthlyCost: Number(monthlyCost) || 0,
          requiredMm: Number(requiredMm) || 1,
          requiredSkills: skillsJson,
        });
      } else {
        await protoCommandService.createProjectRole(Number(projectId), {
          roleName: roleName.trim(),
          level,
          quantity: Number(quantity) || 1,
          monthlyCost: Number(monthlyCost) || 0,
          requiredMm: Number(requiredMm) || 1,
          requiredSkills: skillsJson,
          filled: 0,
        });
      }
      resetForm();
      setAddModalOpen(false);
      await refreshAll(projectId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const deleteRole = async (roleId: number) => {
    if (!projectId) return;
    if (!window.confirm(`롤 #${roleId}을(를) 삭제할까요? 활성 배정이 있으면 삭제할 수 없습니다.`)) return;
    setBusy(true);
    setError(null);
    try {
      await protoCommandService.deleteProjectRole(Number(projectId), roleId);
      if (editingRoleId === roleId) {
        resetForm();
      }
      await refreshAll(projectId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const reduceRoleQty = async (roleId: number, roleNm: string, currentQty: number) => {
    if (!projectId) return;
    const newQty = currentQty - 1;
    if (newQty < 1) {
      await deleteRole(roleId);
      return;
    }
    if (!window.confirm(`${roleNm} 역할의 필요 인원을 ${currentQty}명 → ${newQty}명으로 축소하시겠습니까?`)) return;
    setBusy(true);
    try {
      await protoCommandService.updateProjectRole(Number(projectId), roleId, { quantity: newQty });
      await refreshAll(projectId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const rolloffAssignment = async (assignmentId: number) => {
    if (!projectId) return;
    if (!window.confirm(`배정 #${assignmentId}을(를) Roll-off 할까요?`)) return;
    setBusy(true);
    setError(null);
    try {
      await protoCommandService.rolloffAssignment(assignmentId, "팀 관리 화면에서 Roll-off");
      await refreshAll(projectId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const replaceAssignment = async (assignmentId: number) => {
    if (!projectId) return;
    if (!window.confirm(`배정 #${assignmentId} 교체 요청을 보낼까요?`)) return;
    setBusy(true);
    setError(null);
    try {
      await protoCommandService.replaceAssignment(assignmentId, "팀 관리 화면에서 교체 요청");
      await refreshAll(projectId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const protoOptions: ProtoProjectOption[] = useMemo(
    () =>
      projects.map((p) => {
        const b = teamMetaBadge(p);
        const stage = str(p.pipelineStage);
        const client = str(p.client);
        return {
          id: p.id,
          name: str(p.name) || `#${p.id}`,
          meta: [client, stage, b.label].filter(Boolean).join(" · "),
          badgeLabel: b.label,
          badgeClass: b.cls
        };
      }),
    [projects]
  );

  const projMap = team?.project as Record<string, unknown> | undefined;
  const pmName = projMap ? str(projMap.pmName) : "";
  const rolesTeam = asRecordArray(team?.roles);
  const hasPmName = Boolean(pmName);
  const pmAssigns = collectPmAssignments(rolesTeam);
  const activePm = pmAssigns.find((a) => String(a.status ?? "").toLowerCase() === "active");
  const proposedPm = pmAssigns.find((a) => String(a.status ?? "").toLowerCase() === "proposed");

  const budget = num(cost?.budget);
  const totalCost = num(cost?.totalLaborCost);
  const utilPct = num(cost?.budgetUtilizationPct);
  const remain = budget - totalCost;

  const gridTemplateColumns = useMemo(() => {
    const filtered = rolesTeam.filter((role) => !isPmOnlySyntheticRole(role));
    const n = teamGridCardCount(hasPmName, activePm, proposedPm, filtered);
    if (n > 4) return "repeat(5, 1fr)";
    if (n > 2) return `repeat(${Math.min(n, 4)}, 1fr)`;
    return "repeat(3, 1fr)";
  }, [hasPmName, activePm, proposedPm, rolesTeam]);

  const openAddRole = () => {
    resetForm();
    setAddModalOpen(true);
  };

  const openEditRole = (roleId: number) => {
    const found = roles.find((x) => x.id === roleId);
    if (found) {
      hydrateForm(found);
      setAddModalOpen(true);
    }
  };

  const selectedMatchRole = useMemo(
    () => roles.find((x) => x.id === matchRoleId) ?? null,
    [roles, matchRoleId]
  );

  const matchWeightSum = matchAvailability + matchSkill + matchHistory;
  const selectedCandidates = asRecordArray(matchResult?.candidates);

  const closeMatchModal = () => {
    setMatchModalOpen(false);
    setMatchLoading(false);
    setMatchError(null);
    setMatchResult(null);
    setConfirmOpen(false);
    setSelectedCandidate(null);
    setProposingId(null);
    setExpandedCandidateId(null);
  };

  const runTeamMatch = useCallback(
    async (roleId: number) => {
      if (!projectId) return;
      setMatchLoading(true);
      setMatchError(null);
      try {
        const res = (await protoQueryService.matchTeam({
          projectId: Number(projectId),
          roleId: roleId,
          weights: {
            availability: matchAvailability,
            skill_match: matchSkill,
            history_fit: matchHistory,
          },
          topN: 10,
          user: userKey,
        })) as MatchTeamResponse;
        setMatchResult(res);
      } catch (e) {
        setMatchError(e instanceof Error ? e.message : String(e));
        setMatchResult(null);
      } finally {
        setMatchLoading(false);
      }
    },
    [matchAvailability, matchHistory, matchSkill, projectId, userKey]
  );

  const openMatchModal = (roleId: number) => {
    setMatchRoleId(roleId);
    setMatchModalOpen(true);
    setMatchError(null);
    setMatchResult(null);
    setConfirmOpen(false);
    setSelectedCandidate(null);
    setExpandedCandidateId(null);
    void runTeamMatch(roleId);
  };

  const openProposeConfirm = () => {
    if (!selectedCandidate || isTeamCandidateBlocked(selectedCandidate)) return;
    const found = selectedCandidates.find((c) => num(c.id) === num(selectedCandidate?.id)) ?? null;
    if (!found) return;
    setSelectedCandidate(found);
    setConfirmOpen(true);
  };

  useEffect(() => {
    if (selectedCandidates.length === 0) {
      setSelectedCandidate(null);
      setExpandedCandidateId(null);
      return;
    }
    const first = selectedCandidates.find((c) => !isTeamCandidateBlocked(c)) ?? selectedCandidates[0] ?? null;
    setSelectedCandidate(first);
    setExpandedCandidateId(first ? num(first.id) : null);
  }, [selectedCandidates]);

  const confirmProposeMember = async () => {
    if (!projectId || !matchRoleId || !selectedCandidate) return;
    const empId = num(selectedCandidate.id);
    if (!Number.isFinite(empId)) return;
    setProposingId(empId);
    setMatchError(null);
    try {
      await protoCommandService.createAssignment({
        projectId: Number(projectId),
        employeeId: empId,
        roleId: matchRoleId,
        assignmentType: "member",
        matchScore: num(selectedCandidate.totalScore),
        requester: roleFromUserKey(userKey),
        createApproval: true,
        approvalType: "team_assign",
        approverRole: "SL",
      });
      setToastMessage({
        type: "success",
        text: "팀원 배정이 제안되었습니다. SL 인박스 승인을 확인하세요.",
      });
      setConfirmOpen(false);
      closeMatchModal();
      await refreshAll(projectId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMatchError(msg);
      setToastMessage({ type: "error", text: msg });
    } finally {
      setProposingId(null);
    }
  };

  const overlayBusy = busy || matchLoading || projectsLoading;

  return (
    <div aria-busy={overlayBusy}>
      <ProtoLoadingOverlay active={overlayBusy} />
      {toastMessage ? (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 700,
            padding: "10px 16px",
            borderRadius: 8,
            fontSize: 13,
            boxShadow: "var(--shadow-popover)",
            background: toastMessage.type === "success" ? "var(--green-light)" : "var(--red-light)",
            color: toastMessage.type === "success" ? "var(--green)" : "var(--red)",
            border: "1px solid var(--border2)",
          }}
        >
          {toastMessage.text}
        </div>
      ) : null}
      <div className="teaming-proto">
      <ProtoProjectDropdown
        label="배정 대상 프로젝트 선택"
        dropdownTitle="내 프로젝트 목록"
        options={protoOptions}
        selectedId={projectId}
        onSelect={setProjectId}
      />

      <div className="tm-summary-bar">
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
            {projMap ? str(projMap.name) : "프로젝트를 선택해주세요"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
            {projMap
              ? `${str(projMap.pipelineStage || "Execution")} Mode · Team Composition Board`
              : "Execution Mode · Team Composition Board"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--text3)" }}>인건비 예산 (PROMIS Act.)</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
              {cost ? (
                <>
                  {formatWon(budget)}{" "}
                  <span style={{ color: "var(--text3)", fontWeight: 400 }}>{utilPct.toFixed(1)}% 사용</span>
                </>
              ) : (
                "—"
              )}
            </div>
            <div className="prog-bar" style={{ width: 160 }}>
              <div className="prog-fill" style={{ width: `${Math.min(utilPct, 100)}%` }} />
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: remain >= 0 ? "var(--green)" : "var(--red)" }}>
            {cost ? (remain >= 0 ? `잔여: ${formatWon(remain)}` : `초과: ${formatWon(Math.abs(remain))}`) : "—"}
          </div>
          <button
            type="button"
            className="tm-scope-btn"
            onClick={() =>
              navigateProto("scoping", projectId ? { projectId: Number(projectId) } : undefined)
            }
            disabled={!projectId}
          >
            <svg width={12} height={12} viewBox="0 0 16 16" fill="none" aria-hidden>
              <rect x={2} y={2} width={12} height={12} rx={2} stroke="currentColor" strokeWidth={1.5} />
              <path d="M5 8h6M5 5h4M5 11h3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
            </svg>
            프로젝트 범위 정의
          </button>
          <button type="button" className="tm-add-role-btn" onClick={() => openAddRole()} disabled={!projectId || busy}>
            <span style={{ fontSize: 14, lineHeight: 1, fontWeight: 300 }}>+</span> 역할 추가
          </button>
        </div>
      </div>

      {error ? <p className="team-mgmt__err">{error}</p> : null}

      <div className="tm-team-grid" style={{ gridTemplateColumns }}>
        {!hasPmName && rolesTeam.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
              프로젝트 초기 단계
            </div>
            <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 6 }}>
              PM이 배정되지 않은 프로젝트입니다.
            </div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 20 }}>
              먼저 PM을 배정하고, 프로젝트 범위 정의를 통해 역할을 설정하세요.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {isAM ? (
                <button type="button" className="btn btn-primary" onClick={() => navigateProto("pm-matching")}>
                  PM 배정하기
                </button>
              ) : null}
              <button
                type="button"
                className="btn"
                style={{ borderColor: "var(--green)", color: "var(--green)" }}
                onClick={() =>
                  navigateProto("scoping", projectId ? { projectId: Number(projectId) } : undefined)
                }
              >
                프로젝트 범위 정의
              </button>
            </div>
          </div>
        ) : (
          <>
            <PmTeamCardBlock
              hasPmName={hasPmName}
              pmName={pmName}
              activePm={activePm}
              proposedPm={proposedPm}
              isAM={isAM}
              onRoloff={(id) => void rolloffAssignment(id)}
              onReplace={(id) => void replaceAssignment(id)}
              onNavigatePm={() => navigateProto("pm-matching")}
            />
            {rolesTeam.filter((role) => !isPmOnlySyntheticRole(role)).map((role) => (
              <RoleSlotCards
                key={str(role.id ?? role.roleName)}
                role={role}
                isPM={isPM}
                isAM={isAM}
                busy={busy}
                onRoloff={(id) => void rolloffAssignment(id)}
                onReplace={(id) => void replaceAssignment(id)}
                onMatch={(rid) => openMatchModal(rid)}
                onEditRole={(rid) => openEditRole(rid)}
                onReduceQty={(rid, rn, q) => void reduceRoleQty(rid, rn, q)}
                onDeleteRole={(rid) => void deleteRole(rid)}
              />
            ))}
          </>
        )}
      </div>

      <ProtoTeamMgmtModal
        open={matchModalOpen}
        wide
        title={
          selectedMatchRole
            ? `AI 후보자 분석 - ${str(selectedMatchRole.roleName)}${selectedMatchRole.level ? ` · ${str(selectedMatchRole.level)}` : ""}`
            : "AI 후보자 분석"
        }
        onCancel={closeMatchModal}
        singleAction
        actionsPrefix={
          <div className="team-mgmt-match-modal__footer-meta">
            {selectedCandidate
              ? isTeamCandidateBlocked(selectedCandidate)
                ? `${str(selectedCandidate.name)} · ${teamCandidateBlockReasons(selectedCandidate).join(", ")}`
                : `${str(selectedCandidate.name)} · 종합 ${num(selectedCandidate.totalScore).toFixed(1)}`
              : "후보를 선택하세요."}
          </div>
        }
        singleActionExtra={
          <button
            type="button"
            className="btn btn-green btn-sm"
            disabled={!selectedCandidate || proposingId != null || isTeamCandidateBlocked(selectedCandidate)}
            onClick={openProposeConfirm}
          >
            {proposingId != null ? "배정 중..." : "배정"}
          </button>
        }
      >
        <div className="team-mgmt-match-modal">
          <div className="team-mgmt-match-modal__summary">
            <div>
              <div className="team-mgmt-match-modal__eyebrow">대상 프로젝트</div>
              <div className="team-mgmt-match-modal__title">{projMap ? str(projMap.name) : "—"}</div>
              <div className="team-mgmt-match-modal__meta">
                {selectedMatchRole
                  ? [str(selectedMatchRole.roleName), str(selectedMatchRole.level), skillsToText(selectedMatchRole.required_skills)]
                      .filter(Boolean)
                      .join(" · ")
                  : "역할 정보를 불러오는 중"}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={matchLoading || !selectedMatchRole}
              onClick={() => {
                if (selectedMatchRole) {
                  void runTeamMatch(selectedMatchRole.id);
                }
              }}
            >
              {matchLoading ? "분석 중..." : "후보자 분석 실행"}
            </button>
          </div>

          <div className="team-mgmt-match-modal__weights">
            <label className="pm-match__slider pm-match__slider--avail">
              <span>가용성 {matchAvailability.toFixed(2)}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={matchAvailability}
                onChange={(e) => setMatchAvailability(Number(e.target.value))}
              />
            </label>
            <label className="pm-match__slider pm-match__slider--skill">
              <span>스킬 매칭 {matchSkill.toFixed(2)}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={matchSkill}
                onChange={(e) => setMatchSkill(Number(e.target.value))}
              />
            </label>
            <label className="pm-match__slider pm-match__slider--hist">
              <span>이력 적합도 {matchHistory.toFixed(2)}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={matchHistory}
                onChange={(e) => setMatchHistory(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="team-mgmt-match-modal__hint">
            가중치 합계 {matchWeightSum.toFixed(2)}. 서버에서 정규화하여 점수 계산합니다.
          </div>

          {matchError ? <p className="team-mgmt__err">{matchError}</p> : null}

          {matchLoading ? <div className="team-mgmt-match-modal__empty">AI 매칭 분석 중...</div> : null}
          {!matchLoading && selectedCandidates.length === 0 ? (
            <div className="team-mgmt-match-modal__empty">표시할 후보가 없습니다. 가중치 조정 후 다시 실행해 주세요.</div>
          ) : null}
          {!matchLoading && selectedCandidates.length > 0 ? (
            <>
              <div className="team-mgmt-match-modal__list">
                {selectedCandidates.map((candidate, idx) => (
                  <TeamMatchCandidateCard
                    key={String(candidate.id ?? idx)}
                    candidate={candidate}
                    rank={idx}
                    selected={num(selectedCandidate?.id) === num(candidate.id)}
                    expanded={expandedCandidateId === num(candidate.id)}
                    onSelect={(c) => {
                      setSelectedCandidate(c);
                      setExpandedCandidateId(num(c.id));
                    }}
                    onToggleExpand={(id) =>
                      setExpandedCandidateId((prev) => {
                        const next = num(id);
                        return prev === next ? null : next;
                      })
                    }
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </ProtoTeamMgmtModal>

      <ProtoTeamMgmtModal
        open={confirmOpen}
        title="배정 제안 확인"
        onCancel={() => {
          setConfirmOpen(false);
          setSelectedCandidate(null);
        }}
        onConfirm={() => void confirmProposeMember()}
      >
        <div className="team-mgmt-confirm">
          <div className="team-mgmt-confirm__title">
            {selectedCandidate ? `${str(selectedCandidate.name)} 님을 최종 후보로 선택합니다.` : "후보를 선택하세요."}
          </div>
          <div className="team-mgmt-confirm__meta">
            {[selectedMatchRole ? str(selectedMatchRole.roleName) : "", selectedMatchRole ? str(selectedMatchRole.level) : ""]
              .filter(Boolean)
              .join(" · ")}
          </div>
          {selectedCandidate ? (
            <div className="team-mgmt-confirm__scores">
              <span>종합 {num(selectedCandidate.totalScore).toFixed(1)}</span>
              <span>가용 {num(selectedCandidate.availabilityScore).toFixed(1)}</span>
              <span>스킬 {num(selectedCandidate.skillScore).toFixed(1)}</span>
              <span>이력 {num(selectedCandidate.historyScore).toFixed(1)}</span>
            </div>
          ) : null}
          <div className="team-mgmt-confirm__body">확인 시 배정 제안이 생성되며, 이후 승인 관리를 통해 최종 확정됩니다.</div>
        </div>
      </ProtoTeamMgmtModal>

      <ProtoTeamMgmtModal
        open={addModalOpen}
        title={editingRoleId != null ? `역할 수정 (#${editingRoleId})` : "역할 추가"}
        onCancel={() => {
          setAddModalOpen(false);
          resetForm();
        }}
        onConfirm={() => void saveRole()}
      >
        <div className="team-mgmt-modal-fields">
          <div>
            <div className="form-label">역할명</div>
            <input className="form-input" value={roleName} onChange={(e) => setRoleName(e.target.value)} />
          </div>
          <div>
            <div className="form-label">레벨 (예: CL3)</div>
            <input className="form-input" value={level} onChange={(e) => setLevel(e.target.value)} />
          </div>
          <div>
            <div className="form-label">필요 인원 수</div>
            <input className="form-input" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div>
            <div className="form-label">롤 월 비용(원)</div>
            <input className="form-input" value={monthlyCost} onChange={(e) => setMonthlyCost(e.target.value)} />
          </div>
          <div>
            <div className="form-label">필요 MM</div>
            <input className="form-input" value={requiredMm} onChange={(e) => setRequiredMm(e.target.value)} />
          </div>
          <div>
            <div className="form-label">필요 스킬 (쉼표로 구분)</div>
            <input className="form-input" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} />
          </div>
        </div>
      </ProtoTeamMgmtModal>
      </div>
    </div>
  );
}

function teamGridCardCount(
  hasPmName: boolean,
  activePm: Record<string, unknown> | undefined,
  proposedPm: Record<string, unknown> | undefined,
  rolesTeam: Array<Record<string, unknown>>
): number {
  let n = 0;
  if (hasPmName && activePm) {
    n += 1;
  } else if (hasPmName) {
    n += 1;
  } else if (proposedPm) {
    n += 1;
  } else {
    n += 1;
  }
  for (const role of rolesTeam) {
    const assignments = asRecordArray(role.assignments);
    const memberAssigns = assignments.filter((a) => String(a.assignmentType ?? "").toLowerCase() !== "pm");
    const activeAssigns = memberAssigns.filter((a) => String(a.status ?? "").toLowerCase() === "active");
    const proposedAssigns = memberAssigns.filter((a) => String(a.status ?? "").toLowerCase() === "proposed");
    const filledCount = activeAssigns.length;
    const pendingCount = proposedAssigns.length;
    const totalNeeded = num(role.quantity) || 1;
    const vacantCount = Math.max(0, totalNeeded - filledCount - pendingCount);
    n += filledCount + pendingCount + vacantCount;
  }
  return n;
}

type PmBlockProps = {
  hasPmName: boolean;
  pmName: string;
  activePm: Record<string, unknown> | undefined;
  proposedPm: Record<string, unknown> | undefined;
  isAM: boolean;
  onRoloff: (id: number) => void;
  onReplace: (id: number) => void;
  onNavigatePm: () => void;
};

function PmTeamCardBlock({
  hasPmName,
  pmName,
  activePm,
  proposedPm,
  isAM,
  onRoloff,
  onReplace,
  onNavigatePm
}: PmBlockProps) {
  const pmAid = activePm ? num(activePm.id) : NaN;

  if (hasPmName && activePm) {
    return (
      <div className="team-card assigned">
        <div style={{ position: "absolute", top: 8, left: 8, fontSize: 9, color: "var(--text3)" }}>PM</div>
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            fontSize: 9,
            padding: "2px 6px",
            borderRadius: 3,
            background: "var(--green-light)",
            color: "var(--green)",
            fontWeight: 600
          }}
        >
          배정완료
        </div>
        <div className="team-avatar pm">{pmName.charAt(0)}</div>
        <div className="team-name" style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>
          {pmName} ★
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
          {str(activePm.employeeCl)}
          {activePm.employeeTeam ? ` · ${str(activePm.employeeTeam)}` : ""}
        </div>
        <div style={{ fontSize: 11, color: "var(--accent2)", marginTop: 2 }}>Project Manager</div>
        {activePm.employeeCost ? (
          <div className="team-salary" style={{ marginTop: 4 }}>
            {formatWon(num(activePm.employeeCost))}/월
          </div>
        ) : null}
        {isAM && Number.isFinite(pmAid) ? (
          <div className="team-actions">
            <button type="button" className="team-btn" onClick={() => onReplace(pmAid)}>
              교체 (Replace)
            </button>
            <button
              type="button"
              className="team-btn"
              style={{ borderColor: "rgba(214,48,49,0.4)", color: "var(--red)" }}
              onClick={() => onRoloff(pmAid)}
            >
              종료 (Roll-off)
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (hasPmName && !activePm) {
    return (
      <div className="team-card assigned">
        <div style={{ position: "absolute", top: 8, left: 8, fontSize: 9, color: "var(--text3)" }}>PM</div>
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            fontSize: 9,
            padding: "2px 6px",
            borderRadius: 3,
            background: "var(--green-light)",
            color: "var(--green)",
            fontWeight: 600
          }}
        >
          배정완료
        </div>
        <div className="team-avatar pm">{pmName.charAt(0)}</div>
        <div className="team-name" style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>
          {pmName} ★
        </div>
        <div style={{ fontSize: 11, color: "var(--accent2)", marginTop: 2 }}>Project Manager</div>
      </div>
    );
  }

  if (proposedPm) {
    const en = str(proposedPm.employeeName) || "?";
    return (
      <div className="team-card" style={{ borderColor: "var(--yellow)", borderStyle: "dashed" }}>
        <div style={{ position: "absolute", top: 8, left: 8, fontSize: 9, color: "var(--text3)" }}>PM</div>
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            fontSize: 9,
            padding: "2px 6px",
            borderRadius: 3,
            background: "var(--yellow-light)",
            color: "var(--yellow)",
            fontWeight: 600
          }}
        >
          승인 진행중
        </div>
        <div
          className="team-avatar"
          style={{ background: "var(--yellow-light)", color: "var(--yellow)", margin: "0 auto 8px" }}
        >
          {en.charAt(0)}
        </div>
        <div className="team-name" style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>
          {str(proposedPm.employeeName)}
        </div>
        <div style={{ fontSize: 11, color: "var(--yellow)", marginTop: 2 }}>PM 배정 승인 대기중</div>
        <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>BL/SL 승인 완료 시 확정</div>
      </div>
    );
  }

  return (
    <div
      className="team-card"
      style={{
        borderColor: "var(--orange)",
        borderStyle: "dashed",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 180
      }}
    >
      <div style={{ position: "absolute", top: 8, left: 8, fontSize: 9, color: "var(--text3)" }}>PM</div>
      <div
        style={{
          position: "absolute",
          top: 6,
          right: 8,
          fontSize: 9,
          padding: "2px 6px",
          borderRadius: 3,
          background: "var(--orange-light)",
          color: "var(--orange)",
          fontWeight: 600
        }}
      >
        미배정
      </div>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "2px dashed var(--border2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          color: "var(--text3)"
        }}
      >
        +
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--orange)", marginTop: 8 }}>PM 미배정</div>
      {isAM ? (
        <button type="button" className="btn btn-primary btn-sm" style={{ width: "100%", marginTop: 10 }} onClick={onNavigatePm}>
          PM 배정하기
        </button>
      ) : (
        <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>AM이 PM을 배정해야 합니다</div>
      )}
    </div>
  );
}

function teamCandidateInitial(name: string): string {
  const t = name.trim();
  return t ? t.charAt(0) : "?";
}

function teamCandidateBlockReasons(candidate: CandidateRow): string[] {
  const risks = coerceStringList(candidate.riskFlags);
  const currentProjects = coerceStringList(candidate.currentProjects);
  const reasons = [...risks];
  if (Boolean(candidate.isDuplicated)) {
    reasons.push("이미 본 프로젝트에 배정되어 있습니다.");
  }
  if (currentProjects.length > 0 && !reasons.some((x) => x.includes("현재 투입 프로젝트"))) {
    reasons.push(`현재 투입 프로젝트: ${currentProjects.join(", ")}`);
  }
  return Array.from(new Set(reasons.filter(Boolean)));
}

function isTeamCandidateBlocked(candidate: CandidateRow): boolean {
  return teamCandidateBlockReasons(candidate).length > 0;
}

function teamCandidateToggleKey(handler: () => void) {
  return (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler();
    }
  };
}

type TeamMatchCandidateCardProps = {
  candidate: CandidateRow;
  rank: number;
  selected: boolean;
  expanded: boolean;
  onSelect: (candidate: CandidateRow) => void;
  onToggleExpand: (id: unknown) => void;
};

function TeamMatchCandidateCard({
  candidate,
  rank,
  selected,
  expanded,
  onSelect,
  onToggleExpand
}: TeamMatchCandidateCardProps) {
  const name = str(candidate.name);
  const role = str(candidate.role);
  const team = str(candidate.team);
  const cl = str(candidate.cl);
  const totalScore = Math.round(num(candidate.totalScore));
  const availabilityScore = Math.min(100, Math.round(num(candidate.availabilityScore)));
  const skillScore = Math.min(100, Math.round(num(candidate.skillScore)));
  const historyScore = Math.min(100, Math.round(num(candidate.historyScore)));
  const reasons = coerceStringList(candidate.reasons);
  const skills = coerceStringList(candidate.skills);
  const currentProjects = coerceStringList(candidate.currentProjects);
  const monthlyCost = num(candidate.monthlyCost);
  const isBest = rank === 0;
  const blockReasons = teamCandidateBlockReasons(candidate);
  const isBlocked = blockReasons.length > 0;

  const selectCard = () => onSelect(candidate);
  const toggleExpand = () => {
    onSelect(candidate);
    onToggleExpand(candidate.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={"candidate-item pm-cand-card" + (selected ? " selected" : "")}
      style={{
        position: "relative",
        flexDirection: "column",
        alignItems: "stretch",
        opacity: isBlocked ? 0.5 : 1
      }}
      onClick={selectCard}
      onKeyDown={teamCandidateToggleKey(selectCard)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {isBest ? (
          <div className="best-badge">Best</div>
        ) : (
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text3)",
              minWidth: 18,
              textAlign: "center"
            }}
          >
            #{rank + 1}
          </div>
        )}
        <div
          className="cand-avatar"
          style={selected ? { background: "var(--accent-light)", color: "var(--accent2)", fontWeight: 700 } : undefined}
        >
          {teamCandidateInitial(name)}
        </div>
        <div className="cand-info">
          <div>
            <span className="cand-name">{name || "—"}</span>
            <span className="cand-cl">{cl}</span>
          </div>
          <div className="cand-role">{[role, team].filter(Boolean).join(" · ")}</div>
        </div>
        <div className="cand-scores">
          <div className="score-win">{availabilityScore}</div>
          <div style={{ fontSize: 9, color: "var(--text3)" }}>가용</div>
          <div className="score-main">{totalScore}</div>
          <div style={{ fontSize: 9, color: "var(--text3)" }}>적합도</div>
        </div>
        {isBlocked ? <div className="team-mgmt-match-card__blocked">매칭불가</div> : null}
        <button
          type="button"
          className="team-mgmt-match-card__toggle"
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand();
          }}
        >
          {expanded ? "▴" : "▾"}
        </button>
      </div>

      {expanded ? (
        <div style={{ marginTop: 10 }}>
          <div className="match-viz">
            <div className="match-node" style={{ fontSize: 10 }}>
              🧩<br />
              Role
              <br />
              Reqs
            </div>
            <div style={{ flex: 1 }}>
              <div className="match-bar-row">
                <span className="match-bar-label">가용성</span>
                <div className="match-bar">
                  <div className="match-bar-fill" style={{ width: `${availabilityScore}%`, background: "var(--blue)" }} />
                </div>
                <span style={{ fontSize: 10, color: "var(--blue)", marginLeft: 4 }}>{availabilityScore}%</span>
              </div>
              <div className="match-bar-row">
                <span className="match-bar-label">스킬 매칭</span>
                <div className="match-bar">
                  <div className="match-bar-fill" style={{ width: `${skillScore}%`, background: "var(--accent)" }} />
                </div>
                <span style={{ fontSize: 10, color: "var(--accent2)", marginLeft: 4 }}>{skillScore}%</span>
              </div>
              <div className="match-bar-row">
                <span className="match-bar-label">이력 적합도</span>
                <div className="match-bar">
                  <div className="match-bar-fill" style={{ width: `${historyScore}%`, background: "var(--green)" }} />
                </div>
                <span style={{ fontSize: 10, color: "var(--green)", marginLeft: 4 }}>{historyScore}%</span>
              </div>
            </div>
            <div className="match-node" style={{ fontSize: 10 }}>
              👤<br />
              Candidate
              <br />
              Profile
            </div>
          </div>

          <div className="ai-reason">
            <div className="ai-reason-title">AI Recommendation Reasoning</div>
            <div>{reasons.length > 0 ? reasons.join(", ") : "역할 요구사항과 후보자 프로파일 기반 추천 결과입니다."}</div>
          </div>

          {blockReasons.length > 0 ? <div className="team-mgmt-match-card__risk">{blockReasons.join(", ")}</div> : null}
          {currentProjects.length > 0 ? (
            <div className="team-mgmt-match-card__meta">현재 투입 프로젝트: {currentProjects.join(", ")}</div>
          ) : null}
          {monthlyCost > 0 ? <div className="team-mgmt-match-card__meta">월 단가: {formatWon(monthlyCost)}</div> : null}

          {skills.length > 0 ? (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
              {skills.slice(0, 8).map((s) => (
                <span key={s} className="tag tag-skill" style={{ fontSize: 10 }}>
                  {s}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type RoleSlotProps = {
  role: Record<string, unknown>;
  isPM: boolean;
  isAM: boolean;
  busy: boolean;
  onRoloff: (id: number) => void;
  onReplace: (id: number) => void;
  onMatch: (roleId: number) => void;
  onEditRole: (roleId: number) => void;
  onReduceQty: (roleId: number, roleName: string, qty: number) => void;
  onDeleteRole: (roleId: number) => void;
};

function RoleSlotCards({
  role,
  isPM,
  isAM,
  busy,
  onRoloff,
  onReplace,
  onMatch,
  onEditRole,
  onReduceQty,
  onDeleteRole
}: RoleSlotProps) {
  const roleId = num(role.id);
  const roleName = str(role.roleName);
  const assignments = asRecordArray(role.assignments);
  const memberAssigns = assignments.filter((a) => String(a.assignmentType ?? "").toLowerCase() !== "pm");
  const activeAssigns = memberAssigns.filter((a) => String(a.status ?? "").toLowerCase() === "active");
  const proposedAssigns = memberAssigns.filter((a) => String(a.status ?? "").toLowerCase() === "proposed");
  const filledCount = activeAssigns.length;
  const pendingCount = proposedAssigns.length;
  const totalNeeded = num(role.quantity) || 1;
  const vacantCount = Math.max(0, totalNeeded - filledCount - pendingCount);
  const hasAnyAssignment = filledCount > 0 || pendingCount > 0;

  const isPmRole =
    roleName === "PM" || roleName === "Project Manager" || roleName === "Application PM";

  const cards: ReactNode[] = [];

  for (const a of activeAssigns) {
    const aid = num(a.id);
    const empName = str(a.employeeName);
    const statusLabel = "배정완료";
    const initial = empName ? empName.charAt(0) : "?";
    const skills = normalizeSkillArray(a.employeeSkills);
    const assignType = String(a.assignmentType ?? "").toLowerCase();
    const showRowActions =
      String(a.status ?? "").toLowerCase() === "active" &&
      ((isAM && (isPmRole || assignType === "pm")) || (isPM && !isPmRole && assignType !== "pm"));

    cards.push(
      <div key={`a-${aid}`} className="team-card assigned">
        <div style={{ position: "absolute", top: 8, left: 8, fontSize: 9, color: "var(--text3)" }}>{roleName}</div>
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            fontSize: 9,
            padding: "2px 6px",
            borderRadius: 3,
            background: "var(--green-light)",
            color: "var(--green)",
            fontWeight: 600
          }}
        >
          {statusLabel}
        </div>
        <div className="team-avatar" style={{ background: "var(--accent-light)", color: "var(--accent2)", fontWeight: 700 }}>
          {initial}
        </div>
        <div className="team-name" style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>
          {empName}
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
          {str(a.employee_empNo)}
          {a.employeeCl ? ` · ${str(a.employeeCl)}` : ""}
        </div>
        <div style={{ fontSize: 11, color: "var(--accent2)", marginTop: 2 }}>{str(a.employeeRole)}</div>
        {a.employeeTeam ? (
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }}>{str(a.employeeTeam)}</div>
        ) : null}
        {a.employeeCost ? (
          <div className="team-salary" style={{ marginTop: 4 }}>
            {formatWon(num(a.employeeCost))}/월
          </div>
        ) : null}
        {skills.length > 0 ? (
          <div className="tags" style={{ justifyContent: "center", marginTop: 6 }}>
            {skills.slice(0, 3).map((s) => (
              <span key={s} className="tag tag-skill" style={{ fontSize: 10 }}>
                {s}
              </span>
            ))}
          </div>
        ) : null}
        {showRowActions && Number.isFinite(aid) ? (
          <div className="team-actions">
            <button type="button" className="team-btn" onClick={() => onReplace(aid)}>
              교체 (Replace)
            </button>
            <button
              type="button"
              className="team-btn"
              style={{ borderColor: "rgba(214,48,49,0.4)", color: "var(--red)" }}
              onClick={() => onRoloff(aid)}
            >
              종료 (Roll-off)
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  for (const a of proposedAssigns) {
    const aid = num(a.id);
    const empName = str(a.employeeName);
    const initial = empName ? empName.charAt(0) : "?";
    const skillsP = normalizeSkillArray(a.employeeSkills);
    cards.push(
      <div key={`p-${aid}`} className="team-card assigned">
        <div style={{ position: "absolute", top: 8, left: 8, fontSize: 9, color: "var(--text3)" }}>{roleName}</div>
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            fontSize: 9,
            padding: "2px 6px",
            borderRadius: 3,
            background: "var(--yellow-light)",
            color: "var(--yellow)",
            fontWeight: 600
          }}
        >
          승인대기
        </div>
        <div className="team-avatar" style={{ background: "var(--accent-light)", color: "var(--accent2)", fontWeight: 700 }}>
          {initial}
        </div>
        <div className="team-name" style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>
          {empName}
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
          {str(a.employee_empNo)}
          {a.employeeCl ? ` · ${str(a.employeeCl)}` : ""}
        </div>
        <div style={{ fontSize: 11, color: "var(--accent2)", marginTop: 2 }}>{str(a.employeeRole)}</div>
        {a.employeeTeam ? (
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }}>{str(a.employeeTeam)}</div>
        ) : null}
        {a.employeeCost ? (
          <div className="team-salary" style={{ marginTop: 4 }}>
            {formatWon(num(a.employeeCost))}/월
          </div>
        ) : null}
        {skillsP.length > 0 ? (
          <div className="tags" style={{ justifyContent: "center", marginTop: 6 }}>
            {skillsP.slice(0, 3).map((s) => (
              <span key={s} className="tag tag-skill" style={{ fontSize: 10 }}>
                {s}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  for (let v = 0; v < vacantCount; v++) {
    const canReduce = totalNeeded > 1;
    const canDelete = !hasAnyAssignment && !canReduce;
    const showDelete = canReduce || canDelete;
    const deleteLabel = canReduce ? "인원 축소" : "삭제";

    cards.push(
      <div
        key={`v-${roleId}-${v}`}
        className="team-card vacant"
        onClick={() => onMatch(roleId)}
        style={{ cursor: "pointer" }}
      >
        <div style={{ position: "absolute", top: 8, left: 8, fontSize: 9, color: "var(--text3)" }}>{roleName}</div>
        <div style={{ position: "absolute", top: 6, right: 8, display: "flex", gap: 4 }}>
          <span
            style={{
              fontSize: 9,
              padding: "2px 6px",
              borderRadius: 3,
              background: "var(--orange-light)",
              color: "var(--orange)",
              fontWeight: 600
            }}
          >
            공석
          </span>
          <button
            type="button"
            className="team-btn"
            style={{ fontSize: 9, padding: "2px 5px" }}
            onClick={(e) => {
              e.stopPropagation();
              if (Number.isFinite(roleId)) {
                onEditRole(roleId);
              }
            }}
          >
            수정
          </button>
          {showDelete ? (
            <button
              type="button"
              className="team-btn"
              style={{ fontSize: 9, padding: "2px 5px", background: "var(--red-light)", color: "var(--red)" }}
              onClick={(e) => {
                e.stopPropagation();
                if (canReduce) {
                  onReduceQty(roleId, roleName, totalNeeded);
                } else if (canDelete) {
                  onDeleteRole(roleId);
                }
              }}
            >
              {deleteLabel}
            </button>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: 1,
            justifyContent: "center"
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "2px dashed var(--border2)",
              margin: "0 auto 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              color: "var(--text3)"
            }}
          >
            +
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--orange)" }}>공석 (Vacant)</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>클릭하여 AI 매칭 시작</div>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation();
            onMatch(roleId);
          }}
        >
          AI 매칭 시작
        </button>
      </div>
    );
  }

  return <>{cards}</>;
}
