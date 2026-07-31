"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { protoConfig } from "@/features/proto/config";
import { useProtoSessionUserKey } from "@/features/proto/lib/useProtoSessionUserKey";
import { roleFromUserKey } from "@/features/proto/lib/roleFromUserKey";
import { ProtoLoadingOverlay } from "@/features/proto/components/shared/ProtoLoadingOverlay";
import type { ProtoProjectOption } from "@/features/proto/components/shared/ProtoProjectDropdown";
import { ProtoProjectDropdown } from "@/features/proto/components/shared/ProtoProjectDropdown";
import { ProtoPmCandidateList } from "@/features/proto/components/pm-matching/ProtoPmCandidateList";
import { ProtoTeamingModal } from "@/features/proto/components/team-matching/ProtoTeamingModal";
import { protoCommandService } from "@/features/proto/services/protoCommandService";
import { protoQueryService } from "@/features/proto/services/protoQueryService";
import type { ProtoEmployeeProfileData } from "@/features/proto/types";

type ProjectRow = Record<string, unknown> & { id: number; name?: string };

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

function formatDealEok(v: unknown): string {
  const x = num(v);
  return `${x.toFixed(1)} 억원`;
}

function winProbLabel(v: unknown): string {
  const x = num(v);
  const pct = x <= 1 ? Math.round(x * 100) : Math.round(x);
  return `${pct}% Win`;
}

function pmBadgeForProject(p: ProjectRow): { label: string; cls: ProtoProjectOption["badgeClass"] } {
  const pmName = p.pmName != null ? str(p.pmName) : "";
  if (!pmName) {
    return { label: "PM 배정 필요", cls: "orange" };
  }
  return { label: "PM 배정 완료", cls: "green" };
}

function pipelineChipClass(stage: string): "chip-pre-sales" | "chip-ongoing" | "chip-ready" {
  const s = stage.toLowerCase();
  if (s.includes("contract") || s.includes("won")) {
    return "chip-ready";
  }
  if (s.includes("execution") || s.includes("negotiat")) {
    return "chip-ongoing";
  }
  return "chip-pre-sales";
}

function pipelineChipLabel(stage: string): string {
  if (!stage) return "PRE-SALES";
  return stage.toUpperCase();
}

function personaLines(project: Record<string, unknown>): string[] {
  const desc = str(project.description).trim();
  if (desc) {
    const lines = desc
      .split(/\n+/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 5);
    if (lines.length > 0) {
      return lines.map((l) => (l.startsWith("•") ? l : `• ${l}`));
    }
  }
  const ind = str(project.industry);
  const tech = project.tech_stack;
  const out: string[] = [];
  if (ind) {
    out.push(`• 산업: ${ind}`);
  }
  if (Array.isArray(tech) && tech.length > 0) {
    out.push(`• 기술: ${tech.slice(0, 6).join(", ")}`);
  }
  if (out.length === 0) {
    out.push("• 프로젝트 설명·산업 정보를 등록하면 페르소나 힌트로 표시됩니다.");
  }
  return out;
}

function sliderBg(val: number, color: string): string {
  const pct = (val / 10) * 100;
  return `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, var(--bg4) ${pct}%, var(--bg4) 100%)`;
}

function limitSliderBg(val: number): string {
  const pct = ((val - 1) / 9) * 100;
  return `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${pct}%, var(--bg4) ${pct}%, var(--bg4) 100%)`;
}

/**
 * prototype `PmMatchingPanel` — 3열·드롭다운·가중치·후보 카드 UI 동일.
 */
export default function ProtoPmMatchingPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userKey = useProtoSessionUserKey();
  const requesterRole = roleFromUserKey(userKey);

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [projectId, setProjectId] = useState("");
  const [slDomain, setSlDomain] = useState(6);
  const [slLeader, setSlLeader] = useState(2);
  const [slWinrate, setSlWinrate] = useState(1);
  const [topN, setTopN] = useState(6);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [proposingId, setProposingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ project?: Record<string, unknown>; candidates?: Array<Record<string, unknown>> } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProtoEmployeeProfileData | null>(null);

  const prefix = protoConfig.uiPrefix.replace(/\/$/, "");

  const loadProjects = useCallback(async () => {
    setError(null);
    setProjectsLoading(true);
    try {
      const list = await protoQueryService.getProjects(userKey);
      setProjects(Array.isArray(list) ? (list as unknown as ProjectRow[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }, [userKey]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (projects.length === 0) return;
    const qp = searchParams.get("projectId");
    if (qp != null && qp !== "" && projects.some((p) => String(p.id) === qp)) {
      setProjectId(qp);
      setResult(null);
      return;
    }
    setProjectId((prev) => (prev === "" ? String(projects[0].id) : prev));
  }, [projects, searchParams]);

  const protoOptions: ProtoProjectOption[] = useMemo(
    () =>
      projects.map((p) => {
        const badge = pmBadgeForProject(p);
        const stage = str(p.pipelineStage);
        const client = str(p.client);
        return {
          id: p.id,
          name: str(p.name) || `#${p.id}`,
          meta: [client, stage, winProbLabel(p.winProbability)].filter(Boolean).join(" · "),
          badgeLabel: badge.label,
          badgeClass: badge.cls,
        };
      }),
    [projects],
  );

  const selectedProject = useMemo(
    () => projects.find((p) => String(p.id) === projectId),
    [projects, projectId],
  );

  const displayProject = useMemo(() => {
    if (result?.project && Object.keys(result.project).length > 0) {
      return result.project;
    }
    if (!selectedProject) {
      return null;
    }
    return { ...selectedProject } as Record<string, unknown>;
  }, [result?.project, selectedProject]);

  const domDisp = (slDomain / 10).toFixed(1);
  const leadDisp = (slLeader / 10).toFixed(1);
  const winDisp = (slWinrate / 10).toFixed(1);
  const sumVal = parseFloat(domDisp) + parseFloat(leadDisp) + parseFloat(winDisp);
  const weightExceeded = sumVal > 1.001;

  const runMatch = async () => {
    if (!projectId || weightExceeded) return;
    const d = slDomain / 10;
    const l = slLeader / 10;
    const w = slWinrate / 10;
    const sum = d + l + w;
    const weights = {
      domain: sum > 0 ? d / sum : 0.33,
      leadership: sum > 0 ? l / sum : 0.33,
      winrate: sum > 0 ? w / sum : 0.34,
    };
    setLoading(true);
    setError(null);
    try {
      const res = await protoQueryService.matchPm({
        projectId: Number(projectId),
        weights,
        topN: topN,
        user: userKey,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const openProfile = async (empId: number, fallbackScore: number) => {
    if (!Number.isFinite(empId)) return;
    setProfileOpen(true);
    setProfileLoading(true);
    setProfileError(null);
    setProfile(null);
    try {
      const d = slDomain / 10;
      const l = slLeader / 10;
      const w = slWinrate / 10;
      const sum = d + l + w;
      const weights = {
        domain: sum > 0 ? d / sum : 0.33,
        leadership: sum > 0 ? l / sum : 0.33,
        winrate: sum > 0 ? w / sum : 0.34,
      };
      const data = await protoQueryService.getEmployeeProfile(empId, {
        projectId: projectId ? Number(projectId) : undefined,
        matchType: "pm",
        weights: JSON.stringify(weights),
      });
      const fit = (data.fit ?? {}) as Record<string, unknown>;
      if (fit.score == null && Number.isFinite(fallbackScore)) {
        fit.score = fallbackScore;
      }
      if (!fit.label) {
        fit.label = "PM 적합도";
      }
      setProfile({ ...data, fit: data.fit ?? (fit as ProtoEmployeeProfileData["fit"]) });
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : String(e));
    } finally {
      setProfileLoading(false);
    }
  };

  const proposePm = async (empId: number, matchScore: number) => {
    if (!projectId) return;
    setProposingId(empId);
    setError(null);
    try {
      await protoCommandService.createAssignment({
        projectId: Number(projectId),
        employeeId: empId,
        assignmentType: "pm",
        matchScore,
        requester: requesterRole,
        createApproval: true,
        approvalType: "pm_assign",
        approverRole: "BL",
      });
      void loadProjects();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProposingId(null);
    }
  };

  const candidates = result?.candidates ?? [];
  const stageStr = displayProject ? str(displayProject.pipelineStage) : "";
  const chipCls = pipelineChipClass(stageStr);

  const overlayBusy = projectsLoading || loading || profileLoading;

  return (
    <div aria-busy={overlayBusy}>
      <ProtoLoadingOverlay active={overlayBusy} />
      <div className="teaming-proto">
        <ProtoProjectDropdown
          label="배정 대상 프로젝트 선택"
          dropdownTitle="전체 프로젝트 목록"
          options={protoOptions}
          selectedId={projectId}
          onSelect={setProjectId}
        />

        <div className="three-col">
          <div>
            <div className="panel" style={{ marginBottom: 12 }}>
              <div className="panel-header">
                <div className="panel-title">사업 기회 (Opportunity)</div>
                <span className={"chip " + chipCls}>{pipelineChipLabel(stageStr)}</span>
              </div>
              <div className="panel-body">
                {displayProject ? (
                  <>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--text)",
                        marginBottom: 4,
                        lineHeight: 1.3,
                      }}
                    >
                      {str(displayProject.name)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 12 }}>
                      {str(displayProject.client)}
                    </div>
                    <div className="form-label">사업 규모 (Deal Size)</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>
                      {formatDealEok(displayProject.dealSize)}
                    </div>
                    <div className="sep" />
                    <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6, fontWeight: 600 }}>
                      요구 페르소나 (Persona)
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>
                      {personaLines(displayProject).map((line, i) => (
                        <span key={i}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>프로젝트를 선택하세요.</div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">AI 추천 결과 (Recommendation)</div>
                <span style={{ fontSize: 11, color: "var(--text3)" }}>
                  {candidates.length > 0 ? `상위 ${candidates.length}명 표시` : "상위 6명 표시"}
                </span>
              </div>
              <div className="panel-body" style={{ position: "relative" }}>
                {result == null ? (
                  <div style={{ textAlign: "center", padding: 36, color: "var(--text3)", fontSize: 12 }}>
                    우측에서 가중치를 조정한 뒤 <strong style={{ color: "var(--text2)" }}>후보자 분석 실행 ↺</strong>을 눌러
                    AI 추천을 받으세요.
                  </div>
                ) : (
                  <ProtoPmCandidateList
                    candidates={candidates}
                    proposingId={proposingId}
                    onPropose={(id, s) => void proposePm(id, s)}
                    onOpenProfile={(id, s) => void openProfile(id, s)}
                    onSearchClick={() => router.push(`${prefix}/employees`)}
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">가중치 설정 (Weighting)</div>
              </div>
              <div className="panel-body">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>추천 인원 제한</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent2)" }}>{topN}명</span>
                </div>
                <input
                  type="range"
                  className="teaming-range"
                  min={1}
                  max={10}
                  step={1}
                  value={topN}
                  style={{ background: limitSliderBg(topN), marginBottom: 16 }}
                  onChange={(e) => setTopN(Number(e.target.value))}
                />

                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text3)",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    marginBottom: 10,
                  }}
                >
                  가중치 요소 (Weighting)
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--text2)" }}>도메인 적합성</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent2)" }}>{domDisp}</span>
                </div>
                <input
                  type="range"
                  className="teaming-range"
                  min={0}
                  max={10}
                  step={1}
                  value={slDomain}
                  style={{ background: sliderBg(slDomain, "#6c5ce7") }}
                  onChange={(e) => setSlDomain(Number(e.target.value))}
                />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--text2)" }}>리더십 (직급)</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--green)" }}>{leadDisp}</span>
                </div>
                <input
                  type="range"
                  className="teaming-range"
                  min={0}
                  max={10}
                  step={1}
                  value={slLeader}
                  style={{ background: sliderBg(slLeader, "#00cec9") }}
                  onChange={(e) => setSlLeader(Number(e.target.value))}
                />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--text2)" }}>수주 이력</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--orange)" }}>{winDisp}</span>
                </div>
                <input
                  type="range"
                  className="teaming-range"
                  min={0}
                  max={10}
                  step={1}
                  value={slWinrate}
                  style={{ background: sliderBg(slWinrate, "#e17055"), marginBottom: 14 }}
                  onChange={(e) => setSlWinrate(Number(e.target.value))}
                />

                <div
                  className={"weight-total-box" + (weightExceeded ? " weight-total-box--error" : "")}
                  style={weightExceeded ? undefined : { border: "none", background: "var(--bg4)" }}
                >
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>가중치 합계</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: weightExceeded ? "var(--red)" : sumVal > 0 ? "var(--green)" : "var(--text3)",
                    }}
                  >
                    {sumVal.toFixed(2)}
                  </span>
                </div>

                {weightExceeded ? (
                  <div className="weight-error">가중치 합계가 1.0을 초과했습니다. 슬라이더를 조정해주세요.</div>
                ) : null}

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  disabled={loading || !projectId || weightExceeded}
                  onClick={() => void runMatch()}
                >
                  {loading ? "분석 중…" : "후보자 분석 실행 ↺"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <p style={{ color: "var(--color-danger)", fontSize: 12, marginTop: 12 }}>{error}</p>
        ) : null}

        <ProtoTeamingModal open={profileOpen} title="후보자 프로파일" onClose={() => setProfileOpen(false)}>
          {profileLoading ? (
            <div style={{ fontSize: 12, color: "var(--text3)", padding: 8 }}>불러오는 중...</div>
          ) : profileError ? (
            <div style={{ fontSize: 12, color: "var(--color-danger)", padding: 8 }}>{profileError}</div>
          ) : (
            <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div
                  className="cand-avatar"
                  style={{
                    width: 44,
                    height: 44,
                    fontSize: 17,
                    background: "var(--accent-light)",
                    color: "var(--accent2)",
                  }}
                >
                  {str(profile?.employee?.name).slice(0, 1) || "-"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                    {str(profile?.employee?.name) || "-"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--accent2)" }}>
                    {str(profile?.employee?.role) || "-"} | {str((profile?.employee as Record<string, unknown> | undefined)?.cl) || "-"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{str(profile?.employee?.team) || "-"}</div>
                </div>
              </div>
              {profile?.recommendations != null && profile.recommendations.length > 0 ? (
                <ul style={{ fontSize: 12, color: "var(--text2)", paddingLeft: 18 }}>
                  {profile.recommendations.map((r, i) => (
                    <li key={i}>{r.message}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </ProtoTeamingModal>
      </div>
    </div>
  );
}
