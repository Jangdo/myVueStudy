"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { protoCommandService } from "@/features/proto/services/protoCommandService";
import { useProtoSessionUserKey } from "@/features/proto/lib/useProtoSessionUserKey";
import { roleFromUserKey } from "@/features/proto/lib/roleFromUserKey";
import { protoQueryService } from "@/features/proto/services/protoQueryService";
import { ProtoTeamMgmtModal } from "@/features/proto/components/team-mgmt/ProtoTeamMgmtModal";
import { ProtoMatchingCandidateCards } from "@/features/proto/components/team-matching/ProtoMatchingCandidateCards";
import styles from "./ProtoTeamMatchingPanel.module.css";

type ProjectRow = { id: number; name?: string };
type RoleAssignmentRow = { employeeName?: string; status?: string };
type RoleRow = {
  id: number;
  roleName?: string;
  level?: string;
  required_mm?: number;
  quantity?: number;
  assignments?: RoleAssignmentRow[];
};

type MatchTeamResponse = {
  candidates?: Array<Record<string, unknown>>;
  project?: Record<string, unknown>;
  role?: Record<string, unknown>;
};

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

/**
 * prototype `TeamMatchingPanel` — 상단 요약 바 + 3열(오픈 역할 / 추천 / 가중치·비용).
 */
export default function ProtoTeamMatchingPanel() {
  const searchParams = useSearchParams();
  const qpProjectId = searchParams.get("projectId");
  const userKey = useProtoSessionUserKey();
  const requesterRole = roleFromUserKey(userKey);

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [projectId, setProjectId] = useState("");
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [roleId, setRoleId] = useState("");
  const [skillRaw, setSkillRaw] = useState(5);
  const [ctxRaw, setCtxRaw] = useState(3);
  const [histRaw, setHistRaw] = useState(2);
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [proposingId, setProposingId] = useState<number | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Record<string, unknown> | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchTeamResponse | null>(null);
  const [cost, setCost] = useState<Record<string, unknown> | null>(null);
  const [teamProject, setTeamProject] = useState<Record<string, unknown> | null>(null);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  const loadProjects = useCallback(async () => {
    setError(null);
    try {
      const list = await protoQueryService.getProjects(userKey);
      setProjects(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setProjects([]);
    }
  }, [userKey]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (projects.length === 0) return;
    if (qpProjectId != null && qpProjectId !== "" && projects.some((p) => String(p.id) === qpProjectId)) {
      setProjectId(qpProjectId);
      return;
    }
    setProjectId((prev) => {
      if (prev !== "") return prev;
      return String(projects[0].id);
    });
  }, [projects, qpProjectId]);

  useEffect(() => {
    if (projectId) {
      void (async () => {
        try {
          const tv = await protoQueryService.getProjectTeam(Number(projectId));
          const roleRows = Array.isArray(tv.roles) ? (tv.roles as RoleRow[]) : [];
          setRoles(roleRows);
          setTeamProject((tv.project as Record<string, unknown>) ?? null);
          if (roleRows.length > 0) {
            setRoleId(String(roleRows[0].id));
          } else {
            setRoleId("");
          }
          const c = await protoQueryService.getProjectCost(Number(projectId));
          setCost(c as unknown as Record<string, unknown>);
        } catch {
          setRoles([]);
          setRoleId("");
          setTeamProject(null);
          setCost(null);
        }
      })();
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectDropdownOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [projectDropdownOpen]);

  const sumRaw = skillRaw + ctxRaw + histRaw;
  const wSkillN = sumRaw > 0 ? skillRaw / sumRaw : 0;
  const wCtxN = sumRaw > 0 ? ctxRaw / sumRaw : 0;
  const wHistN = sumRaw > 0 ? histRaw / sumRaw : 0;

  const runMatch = async () => {
    if (!projectId || !roleId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await protoQueryService.matchTeam({
        projectId: Number(projectId),
        roleId: Number(roleId),
        weights: { availability: wSkillN, skill_match: wCtxN, history_fit: wHistN },
        topN: limit,
        user: userKey,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const openProposeConfirm = (empId: number, matchScore: number) => {
    const found = candidates.find((x) => Number(x.id) === empId);
    if (found && Array.isArray(found.currentProjects) && found.currentProjects.length > 0) {
      return;
    }
    setSelectedCandidate(found != null ? found : { id: empId, totalScore: matchScore });
    setConfirmOpen(true);
  };

  const confirmProposeMember = async () => {
    if (!selectedCandidate) return;
    const empId = Number(selectedCandidate.id);
    const matchScore = Number(selectedCandidate.totalScore ?? 0);
    if (!projectId || !roleId) {
      setError("프로젝트 롤을 선택한 뒤 배정 제안을 사용하세요.");
      return;
    }
    setProposingId(empId);
    setError(null);
    try {
      await protoCommandService.createAssignment({
        projectId: Number(projectId),
        employeeId: empId,
        roleId: Number(roleId),
        assignmentType: "member",
        matchScore,
        requester: requesterRole,
        createApproval: true,
        approvalType: "team_assign",
        approverRole: "SL",
      });
      setConfirmOpen(false);
      setSelectedCandidate(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProposingId(null);
    }
  };

  const candidates = result?.candidates ?? [];
  const selectedProject = projects.find((p) => String(p.id) === projectId);
  const selectedRole = roles.find((r) => String(r.id) === roleId);
  const projectSummary = (result?.project ?? teamProject ?? selectedProject ?? {}) as Record<string, unknown>;
  const roleOptions = roles;
  const wSkill = wSkillN.toFixed(2);
  const wCtx = wCtxN.toFixed(2);
  const wHist = wHistN.toFixed(2);
  const totalLabor = Number(cost?.totalLaborCost ?? 0);
  const budget = Number(cost?.budget ?? 0);
  const budgetRem = Number(cost?.budgetRemaining ?? 0);
  const budgetUtil = Number(cost?.budgetUtilizationPct ?? 0);
  const budgetUtilClamped = Math.max(0, Math.min(budgetUtil, 100));
  const formatWon = (v: number) => `₩${Math.round(v).toLocaleString("ko-KR")}`;
  const formatPct = (v: number) => `${Number.isFinite(v) ? v.toFixed(1) : "0.0"}%`;
  const techStack = useMemo(
    () => (Array.isArray(projectSummary.tech_stack) ? (projectSummary.tech_stack as unknown[]).map(String) : []),
    [projectSummary.tech_stack],
  );
  const sliderBg = (val: number, max: number, colorVar: string) => {
    const pct = max > 0 ? (val / max) * 100 : 0;
    return `linear-gradient(to right, ${colorVar} 0%, ${colorVar} ${pct}%, var(--bg4) ${pct}%, var(--bg4) 100%)`;
  };

  return (
    <section className={styles.pageWrap}>
    <div className="teaming-proto">
      <div className={styles.stackLg}>
        <div className={styles.summaryBar}>
          <div className={styles.summaryMain}>
            <div
              ref={projectDropdownRef}
              style={{
                flex: "0 0 auto",
                paddingRight: 20,
                borderRight: "1px solid var(--border)",
                position: "relative",
                cursor: "pointer",
                minWidth: 220,
                textAlign: "center",
              }}
              onClick={() => setProjectDropdownOpen((v) => !v)}
            >
              <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 2 }}>프로젝트</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text)",
                  lineHeight: 1.3,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  justifyContent: "center",
                }}
              >
                <span>{String(projectSummary.name ?? "-")}</span>
                <span style={{ color: "var(--text3)", fontSize: 11 }}>{projectDropdownOpen ? "▴" : "▾"}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{String(projectSummary.client ?? "-")}</div>
              <div
                className={"proj-dropdown" + (projectDropdownOpen ? " open" : "")}
                style={{ top: "calc(100% + 8px)", left: 0, width: 320, maxWidth: "72vw" }}
              >
                <div className="proj-dropdown-head">
                  <div className="proj-dropdown-head-title">내 프로젝트 목록</div>
                </div>
                <div>
                  {projects.length === 0 ? (
                    <div style={{ padding: 16, fontSize: 12, color: "var(--text3)" }}>표시할 프로젝트가 없습니다.</div>
                  ) : (
                    projects.map((p) => {
                      const sel = String(p.id) === projectId;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className={"proj-opt" + (sel ? " proj-opt-selected" : "")}
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectId(String(p.id));
                            setResult(null);
                            setProjectDropdownOpen(false);
                          }}
                        >
                          <div className="proj-opt-inner">
                            <div>
                              <div className="proj-opt-name" style={sel ? { color: "var(--accent2)" } : undefined}>
                                {p.name ? String(p.name) : `#${p.id}`}
                              </div>
                              <div className="proj-opt-meta">프로젝트 선택</div>
                            </div>
                            <span className="proj-opt-badge" style={{ background: "var(--yellow-light)", color: "var(--yellow)" }}>
                              팀원 배정
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            <div style={{ flex: "0 0 auto", padding: "0 20px", borderRight: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 2 }}>수행 기간</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{String(projectSummary.startDate ?? "-")}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>~ {String(projectSummary.endDate ?? "-")}</div>
            </div>
            <div style={{ flex: "0 0 auto", padding: "0 20px", borderRight: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 2 }}>인건비 예산</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--green)" }}>{formatWon(budget)}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>예산 한도</div>
            </div>
            <div style={{ flex: "0 0 auto", padding: "0 20px" }}>
              <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 2 }}>팀 구성 진행률</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 90 }}>
                  <div className="prog-bar" style={{ height: 6 }}>
                    <div className="prog-fill" style={{ width: `${budgetUtilClamped}%` }} />
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--yellow)" }}>{formatPct(budgetUtil)}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>예산 사용률 기준</div>
            </div>
            <div className={styles.summaryTech}>
              <div className={styles.summaryTechLabel}>기술 스택</div>
              <div className={styles.summaryTechTags}>
                {techStack.length > 0 ? (
                  techStack.map((t, i) => (
                    <span key={`${t}-${i}`} className="tag tag-skill" style={{ fontSize: 10 }}>
                      {t}
                    </span>
                  ))
                ) : (
                  <span className={styles.summaryTechEmpty}>-</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`three-col ${styles.threeCol}`}>
        <div className={styles.col}>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">오픈 역할 (Open Roles)</div>
            </div>
            <div className={`panel-body ${styles.openRolesBody}`}>
              {roleOptions.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, color: "var(--text3)", fontSize: 12 }}>
                  등록된 역할이 없습니다.
                </div>
              ) : (
                roleOptions.map((r) => {
                  const assigns = Array.isArray(r.assignments) ? r.assignments : [];
                  const activeList = assigns.filter((a) => str(a.status).toLowerCase() === "active");
                  const proposedList = assigns.filter((a) => str(a.status).toLowerCase() === "proposed");
                  const totalNeeded = Number(r.quantity ?? 1);
                  const filledCount = activeList.length;
                  const pendingCount = proposedList.length;
                  const vacantCount = Math.max(0, totalNeeded - filledCount - pendingCount);
                  const allFilled = vacantCount === 0 && pendingCount === 0;
                  const statusParts: string[] = [];
                  if (filledCount > 0)
                    statusParts.push(`${activeList.map((a) => str(a.employeeName)).filter(Boolean).join(", ")} (배정)`);
                  if (pendingCount > 0)
                    statusParts.push(`${proposedList.map((a) => str(a.employeeName)).filter(Boolean).join(", ")} (승인대기)`);
                  if (vacantCount > 0) statusParts.push(`${vacantCount}명 공석`);
                  const statusText = statusParts.length > 0 ? statusParts.join(" / ") : "미진행";
                  const statusColor = allFilled
                    ? "var(--green)"
                    : pendingCount > 0
                      ? "var(--yellow)"
                      : vacantCount > 0
                        ? "var(--orange)"
                        : "var(--text3)";
                  return (
                    <div
                      key={r.id}
                      className={"role-item" + (String(r.id) === roleId ? " active-role" : "")}
                      onClick={() => {
                        setRoleId(String(r.id));
                        setResult(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setRoleId(String(r.id));
                          setResult(null);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={"role-dot " + (allFilled ? "filled" : "open")} />
                      <div className="role-name">{String(r.roleName ?? "")}</div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: "var(--text3)" }}>
                          MM: {String(r.required_mm ?? 0)} / {filledCount}/{totalNeeded}명
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            marginTop: 2,
                            color: statusColor,
                            fontWeight: 600,
                            maxWidth: 140,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {statusText}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className={styles.col}>
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">
                  {selectedRole ? `매칭 대상: ${String(selectedRole.roleName ?? "")}` : "왼쪽에서 역할을 선택하세요"}
                </div>
                <div style={{ fontSize: 11, color: "var(--green)" }}>
                  {candidates.length > 0 ? `상위 ${candidates.length}명 표시` : ""}
                </div>
              </div>
              <button
                type="button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 11px",
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid rgba(253,203,110,0.45)",
                  background: "rgba(253,203,110,0.08)",
                  color: "var(--yellow)",
                  fontFamily: "inherit",
                }}
              >
                배정 보류
              </button>
            </div>
            <div className="panel-body">
              {error ? (
                <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 8 }}>{error}</div>
              ) : null}
              {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>
                  AI 매칭 분석 중... (S-BERT 유사도 계산)
                </div>
              ) : candidates.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>
                  역할 &quot;{String(selectedRole?.roleName ?? "")}&quot; 선택됨.
                  <br />
                  오른쪽 &quot;매칭 실행&quot; 버튼을 클릭하세요.
                </div>
              ) : (
                <ProtoMatchingCandidateCards
                  candidates={candidates}
                  proposingId={proposingId}
                  onPropose={(empId, matchScore) => openProposeConfirm(empId, matchScore)}
                  disablePropose={!roleId}
                  proposingLabel="이 팀원으로 후보 지명"
                  extraScoreKeys={[
                    { key: "availabilityScore", label: "가용" },
                    { key: "skillScore", label: "스킬" },
                    { key: "historyScore", label: "이력" },
                  ]}
                />
              )}
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">가중치 설정 (Weighting)</div>
            </div>
            <div className="panel-body">
              <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, letterSpacing: ".04em", marginBottom: 10 }}>
                가중치 요소 (SUM: 1.0)
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 1 }}>
                <span style={{ fontSize: 12, color: "var(--text2)" }}>조직내 인력</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--blue)" }}>{wSkill}</span>
              </div>
              <input
                className="teaming-range"
                type="range"
                min={0}
                max={10}
                step={1}
                value={skillRaw}
                onChange={(e) => setSkillRaw(Number(e.target.value))}
                style={{ width: "100%", marginBottom: 12, background: sliderBg(skillRaw, 10, "var(--blue)") }}
              />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 1 }}>
                <span style={{ fontSize: 12, color: "var(--text2)" }}>스킬셋 매치</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent2)" }}>{wCtx}</span>
              </div>
              <input
                className="teaming-range"
                type="range"
                min={0}
                max={10}
                step={1}
                value={ctxRaw}
                onChange={(e) => setCtxRaw(Number(e.target.value))}
                style={{ width: "100%", marginBottom: 12, background: sliderBg(ctxRaw, 10, "var(--accent)") }}
              />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 1 }}>
                <span style={{ fontSize: 12, color: "var(--text2)" }}>유사 이력</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--green)" }}>{wHist}</span>
              </div>
              <input
                className="teaming-range"
                type="range"
                min={0}
                max={10}
                step={1}
                value={histRaw}
                onChange={(e) => setHistRaw(Number(e.target.value))}
                style={{ width: "100%", marginBottom: 4, background: sliderBg(histRaw, 10, "var(--green)") }}
              />

              <div
                style={{
                  background: "var(--bg4)",
                  borderRadius: 7,
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <span style={{ fontSize: 11, color: "var(--text3)" }}>가중치 합계</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>1.00</span>
              </div>

              <div className="sep" />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, marginTop: 2 }}>
                <span style={{ fontSize: 12, color: "var(--text2)" }}>최대 추천 수 (Limit)</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent2)" }}>{limit}명</span>
              </div>
              <input
                className="teaming-range"
                type="range"
                min={1}
                max={20}
                step={1}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                style={{ width: "100%", marginBottom: 14, background: sliderBg(limit - 1, 19, "var(--accent)") }}
              />

              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => void runMatch()}
                disabled={loading || !projectId || !roleId}
              >
                ⚙ 매칭 실행 (Run)
              </button>
            </div>
          </div>

          <div className="cost-panel">
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>인건비 계산기</div>
            <div style={{ fontSize: 11, color: "var(--text3)", padding: "4px 0" }}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 2 }}>총 예상 인건비</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>{formatWon(totalLabor)}</div>
              {Array.isArray(cost?.lineItems) && (cost?.lineItems as Array<Record<string, unknown>>).length > 0 ? (
                (cost?.lineItems as Array<Record<string, unknown>>).map((item, i) => (
                  <div
                    key={`cost-${i}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                        {String(item.role ?? "")}{" "}
                        {String(item.status ?? "") === "active" ? (
                          <span
                            style={{
                              fontSize: 9,
                              padding: "1px 5px",
                              borderRadius: 3,
                              background: "var(--green-light)",
                              color: "var(--green)",
                            }}
                          >
                            확정
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 9,
                              padding: "1px 5px",
                              borderRadius: 3,
                              background: "var(--yellow-light)",
                              color: "var(--yellow)",
                            }}
                          >
                            대기
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text3)" }}>{String(item.employeeName ?? "")}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                        {formatWon(Number(item.total_cost ?? 0))}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text3)" }}>
                        {String(item.mm ?? 0)}MM / {formatWon(Number(item.monthlyCost ?? 0))}/월
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 11, color: "var(--text3)", padding: "8px 0" }}>배정된 인력이 없습니다.</div>
              )}
              {roleOptions.map((r) => {
                const assigns = Array.isArray(r.assignments) ? r.assignments : [];
                const activeCount = assigns.filter((a) => {
                  const s = String(a.status ?? "").toLowerCase();
                  return s === "active" || s === "proposed";
                }).length;
                const vacantCount = Math.max(0, Number(r.quantity ?? 0) - activeCount);
                if (vacantCount <= 0) return null;
                return (
                  <div
                    key={`vacant-${r.id}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 0",
                      borderBottom: "1px solid var(--border)",
                      opacity: 0.5,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text3)" }}>
                        {String(r.roleName ?? "")}{" "}
                        <span
                          style={{
                            fontSize: 9,
                            padding: "1px 5px",
                            borderRadius: 3,
                            background: "var(--orange-light)",
                            color: "var(--orange)",
                          }}
                        >
                          공석 {vacantCount}명
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 11, color: "var(--text3)" }}>미산정</div>
                  </div>
                );
              })}
              <div className="sep" style={{ margin: "10px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                <span style={{ color: "var(--text3)" }}>총 인건비</span>
                <span style={{ color: "var(--text)", fontWeight: 700 }}>{formatWon(totalLabor)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: "var(--text3)" }}>인건비 예산 한도</span>
                <span style={{ color: "var(--green)", fontWeight: 600 }}>{formatWon(budget)}</span>
              </div>
              <div className="prog-bar" style={{ height: 6 }}>
                <div
                  className="prog-fill"
                  style={{
                    width: `${Math.min(budgetUtil, 100)}%`,
                    background: budgetRem < 0 ? "var(--red)" : "var(--green)",
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 6 }}>
                <span style={{ color: "var(--text3)" }}>{budgetRem >= 0 ? "잔여 예산" : "예산 초과"}</span>
                <span style={{ color: budgetRem >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
                  {formatWon(Math.abs(budgetRem))} ({budgetUtil.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
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
            {[selectedRole ? str(selectedRole.roleName) : "", selectedRole ? str(selectedRole.level) : ""].filter(Boolean).join(" · ")}
          </div>
          {selectedCandidate ? (
            <div className="team-mgmt-confirm__scores">
              <span>종합 {Number(selectedCandidate.totalScore ?? 0).toFixed(1)}</span>
              <span>가용 {Number(selectedCandidate.availabilityScore ?? 0).toFixed(1)}</span>
              <span>스킬 {Number(selectedCandidate.skillScore ?? 0).toFixed(1)}</span>
              <span>이력 {Number(selectedCandidate.historyScore ?? 0).toFixed(1)}</span>
            </div>
          ) : null}
          <div className="team-mgmt-confirm__body">확인 시 배정 제안이 생성되며, 이후 승인 관리를 통해 최종 확정됩니다.</div>
        </div>
      </ProtoTeamMgmtModal>
    </div>
    </section>
  );
}
