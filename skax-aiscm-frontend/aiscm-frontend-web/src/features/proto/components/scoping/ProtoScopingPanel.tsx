"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { protoConfig } from "@/features/proto/config";
import { ProtoTeamMgmtModal } from "@/features/proto/components/team-mgmt/ProtoTeamMgmtModal";
import { ProtoScopingProjectDropdown } from "@/features/proto/components/scoping/ProtoScopingProjectDropdown";
import { useProtoSessionUserKey } from "@/features/proto/lib/useProtoSessionUserKey";
import { protoCommandService } from "@/features/proto/services/protoCommandService";
import { protoQueryService } from "@/features/proto/services/protoQueryService";
import type { ProtoProjectDetailData, ProtoProjectItem } from "@/features/proto/types";
import "@/features/proto/styles/scoping/scoping-parity.css";
import "@/features/proto/styles/team-mgmt/team-mgmt-parity.css";

function formatWithComma(v: string): string {
  const digits = v.replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function isoDateToInput(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : "";
}

/** prototype `ScopingPanel` tech_stack 표시 */
function techStackToInput(v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map(String).join(", ");
  if (typeof v === "string") {
    const s = v.trim();
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const parsed = JSON.parse(s) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.map(String).join(", ");
        }
      } catch {
        return s;
      }
    }
    return s;
  }
  return "";
}

function techStackFromInput(s: string): string[] {
  return s
    .split(/\s*,\s*/)
    .map((x) => x.trim())
    .filter(Boolean);
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

type RoleRow = {
  id: number;
  roleName?: string;
  level?: string;
  requiredMm?: number;
  quantity?: number;
  filled?: number;
  requiredSkills?: unknown;
};

/**
 * prototype `ScopingPanel` — 2열(RFP/AI · 스코프 폼) + 역할·예산 블록.
 */
export default function ProtoScopingPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userKey = useProtoSessionUserKey();
  const prefix = protoConfig.uiPrefix.replace(/\/$/, "");

  const [projects, setProjects] = useState<ProtoProjectItem[]>([]);
  const [projectId, setProjectId] = useState("");
  const [detail, setDetail] = useState<ProtoProjectDetailData | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [techStack, setTechStack] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [pmId, setPmId] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [costSummary, setCostSummary] = useState<Record<string, unknown> | null>(null);

  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [addRoleBusy, setAddRoleBusy] = useState(false);
  const [roleName, setRoleName] = useState("Developer");
  const [level, setLevel] = useState("CL3");
  const [quantity, setQuantity] = useState("1");
  const [monthlyCost, setMonthlyCost] = useState("0");
  const [requiredMm, setRequiredMm] = useState("1");
  const [skillsText, setSkillsText] = useState("");

  const loadProjects = async (): Promise<void> => {
    try {
      setLoadingList(true);
      setError("");
      setMessage("");
      const list = await protoQueryService.getProjects(userKey);
      setProjects(list);
      if (list.length === 0) return;

      const qp = searchParams.get("projectId");
      const fromUrl = qp != null && qp !== "" && list.some((p) => String(p.id) === qp);
      const nextId = fromUrl ? qp! : projectId !== "" ? projectId : String(list[0].id);

      if (nextId !== projectId) {
        setProjectId(nextId);
      } else {
        await loadDetail(Number(nextId), { silent: false });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "프로젝트 조회 실패");
    } finally {
      setLoadingList(false);
    }
  };

  const applyDetailToForm = (d: ProtoProjectDetailData): void => {
    setDetail(d);
    setName(d.name ?? "");
    const raw = d as unknown as Record<string, unknown>;
    setDescription(typeof raw.description === "string" ? raw.description : "");
    setIndustry(typeof raw.industry === "string" ? raw.industry : "");
    setPriority(d.priority ?? "Medium");
    setTechStack(techStackToInput(raw.tech_stack));
    setStartDate(isoDateToInput(raw.startDate));
    setEndDate(isoDateToInput(raw.endDate));
    const budgetNum = raw.budget != null && raw.budget !== "" ? Number(raw.budget) : 0;
    setBudget(Number.isFinite(budgetNum) && budgetNum > 0 ? formatWithComma(String(Math.round(budgetNum * 1_000_000))) : "");
    setPmId(raw.pm_id != null ? String(raw.pm_id) : "");
  };

  const loadDetail = async (id: number, opts?: { silent?: boolean }): Promise<void> => {
    const silent = opts?.silent ?? false;
    try {
      if (!silent) {
        setLoadingDetail(true);
      }
      setError("");
      if (!silent) {
        setMessage("");
      }
      const d = await protoQueryService.getProjectDetail(id);
      applyDetailToForm(d);
      try {
        const cost = await protoQueryService.getProjectCost(id);
        setCostSummary(cost as unknown as Record<string, unknown>);
      } catch {
        setCostSummary(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "프로젝트 상세 조회 실패");
      if (!silent) {
        setDetail(null);
      }
    } finally {
      if (!silent) {
        setLoadingDetail(false);
      }
    }
  };

  useEffect(() => {
    void loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (projectId === "") return;
    void loadDetail(Number(projectId), { silent: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const roles = useMemo((): RoleRow[] => {
    const raw = detail as unknown as Record<string, unknown> | null;
    const r = raw?.roles;
    return Array.isArray(r) ? (r as RoleRow[]) : [];
  }, [detail]);

  const resetAddRoleForm = useCallback(() => {
    setRoleName("Developer");
    setLevel("CL3");
    setQuantity("1");
    setMonthlyCost("0");
    setRequiredMm("1");
    setSkillsText("");
  }, []);

  const openAddRole = useCallback(() => {
    resetAddRoleForm();
    setAddRoleOpen(true);
  }, [resetAddRoleForm]);

  const editRole = async (role: RoleRow): Promise<void> => {
    if (!projectId) return;
    const currentName = String(role.roleName ?? role.roleName ?? "");
    const currentLevel = String(role.level ?? "CL3");
    const currentMm = String(role.requiredMm ?? 1);
    const currentQty = String(role.quantity ?? 1);
    const currentSkills = normalizeSkillArray(role.requiredSkills).join(", ");

    const nextName = window.prompt("역할명", currentName);
    if (nextName == null) return;
    const nextLevel = window.prompt("레벨 (예: CL3)", currentLevel);
    if (nextLevel == null) return;
    const nextMm = window.prompt("요구 MM", currentMm);
    if (nextMm == null) return;
    const nextQty = window.prompt("수량 (Qty)", currentQty);
    if (nextQty == null) return;
    const nextSkills = window.prompt("필수 스킬 (쉼표 구분)", currentSkills);
    if (nextSkills == null) return;

    const mmNum = Number(nextMm);
    const qtyNum = Number(nextQty);
    if (!Number.isFinite(mmNum) || !Number.isFinite(qtyNum)) {
      setError("역할 수정 값이 올바르지 않습니다. MM/Qty는 숫자여야 합니다.");
      return;
    }

    try {
      setError("");
      await protoCommandService.updateProjectRole(Number(projectId), role.id, {
        roleName: nextName.trim(),
        level: nextLevel.trim(),
        requiredMm: mmNum,
        quantity: Math.max(0, Math.trunc(qtyNum)),
        requiredSkills: nextSkills
          .split(/\s*,\s*/)
          .map((s) => s.trim())
          .filter(Boolean),
      });
      await loadDetail(Number(projectId), { silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "역할 수정 실패");
    }
  };

  const deleteRole = async (role: RoleRow): Promise<void> => {
    if (!projectId) return;
    const rn = String(role.roleName ?? role.roleName ?? "");
    if (!window.confirm(`역할 "${rn}" 을(를) 삭제하시겠습니까?`)) return;
    try {
      setError("");
      await protoCommandService.deleteProjectRole(Number(projectId), role.id);
      await loadDetail(Number(projectId), { silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "역할 삭제 실패");
    }
  };

  const saveScope = async (): Promise<void> => {
    if (!projectId) return;
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const budgetRaw = budget.replace(/,/g, "").trim();
      const pmTrim = pmId.trim();
      if (budgetRaw !== "" && Number.isNaN(Number(budgetRaw))) {
        setError("예산은 숫자로 입력하세요.");
        setSaving(false);
        return;
      }
      if (pmTrim !== "" && Number.isNaN(Number(pmTrim))) {
        setError("PM 직원 ID는 숫자로 입력하세요.");
        setSaving(false);
        return;
      }
      const budgetRawWon = budgetRaw === "" ? null : Number(budgetRaw);
      const budgetInMillion = budgetRawWon == null ? null : budgetRawWon / 1_000_000;
      await protoCommandService.updateProjectScope(Number(projectId), {
        name,
        description: description.trim() === "" ? null : description,
        industry: industry.trim() === "" ? null : industry.trim(),
        priority: priority.trim() === "" ? null : priority.trim(),
        techStack: techStackFromInput(techStack),
        startDate: startDate.trim() === "" ? null : startDate.trim(),
        endDate: endDate.trim() === "" ? null : endDate.trim(),
        budget: budgetInMillion,
        pmId: pmTrim === "" ? null : Number(pmTrim),
      });
      await loadProjects();
      setMessage(`저장됨: ${name.trim()}`);
      router.push(`${prefix}/team-matching?projectId=${encodeURIComponent(projectId)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "스코프 저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const saveAddRole = async (): Promise<void> => {
    if (!projectId) return;
    setAddRoleBusy(true);
    setError("");
    try {
      await protoCommandService.createProjectRole(Number(projectId), {
        roleName: roleName.trim(),
        level,
        quantity: Number(quantity) || 1,
        monthlyCost: Number(monthlyCost) || 0,
        requiredMm: Number(requiredMm) || 1,
        requiredSkills: JSON.stringify(parseSkills(skillsText)),
        filled: 0,
      });
      setAddRoleOpen(false);
      await loadDetail(Number(projectId), { silent: true });
      setMessage("역할이 추가되었습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "역할 추가 실패");
    } finally {
      setAddRoleBusy(false);
    }
  };

  const projectOptions = useMemo(
    () => projects.map((p) => ({ id: p.id, name: p.name ? `${p.name}` : `#${p.id}` })),
    [projects],
  );

  const budgetVal = Number(budget.replace(/,/g, "") || 0);
  const totalCost = Number(costSummary?.totalLaborCost ?? 0);
  const utilPct = budgetVal > 0 ? ((totalCost / budgetVal) * 100).toFixed(1) : "0.0";
  const selectedProjectName = useMemo(() => projects.find((x) => String(x.id) === projectId)?.name ?? "", [projectId, projects]);

  const navLocked = loadingList || loadingDetail || saving;

  return (
    <div className="teaming-proto">
      <div className="two-col">
        <div>
          <div style={{ marginBottom: 12 }}>
            <ProtoScopingProjectDropdown
              label="프로젝트"
              dropdownTitle="내 프로젝트 목록"
              options={projectOptions}
              selectedId={projectId}
              onSelect={(id) => {
                setProjectId(id);
                setMessage("");
              }}
            />
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">제안요청서 (RFP) / 문서</div>
            </div>
            <div className="panel-body">
              <div className="upload-zone">
                <div className="upload-icon">⬆</div>
                <div>PDF / DOCX / TXT 파일 업로드</div>
                <div style={{ fontSize: 10, marginTop: 3, color: "var(--text3)" }}>드래그하거나 클릭하여 선택</div>
              </div>
              <div className="ai-suggest-box" style={{ marginTop: 10 }}>
                <span>✨ AI 제안 생성 완료 – 적용하기</span>
                <button type="button" className="btn btn-sm btn-primary" style={{ fontSize: 11 }} disabled>
                  적용하기
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            style={{
              width: "100%",
              marginTop: 10,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              padding: "8px 12px",
              borderRadius: 7,
              fontSize: 12,
              cursor: "pointer",
              border: "1px solid rgba(253,203,110,0.4)",
              background: "rgba(253,203,110,0.08)",
              color: "var(--yellow)",
              fontFamily: "inherit",
            }}
          >
            AI PMO Teaming Guide 열기
          </button>
        </div>

        <div>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">프로젝트 개요 (Project Scope)</div>
            </div>
            <div className="panel-body" id="scope-form-body">
              {loadingList || loadingDetail ? (
                <div style={{ textAlign: "center", padding: 30, color: "var(--text3)" }}>프로젝트 데이터 로딩 중...</div>
              ) : (
                <div>
                  <div className="form-label">프로젝트명</div>
                  <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} disabled={navLocked} />

                  <div className="form-label" style={{ marginTop: 10 }}>
                    상세 설명
                  </div>
                  <textarea
                    className="form-input"
                    style={{ minHeight: 90, resize: "vertical" }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={navLocked}
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                    <div>
                      <div className="form-label">시작일</div>
                      <input
                        className="form-input"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        disabled={navLocked}
                      />
                    </div>
                    <div>
                      <div className="form-label">종료일</div>
                      <input className="form-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={navLocked} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                    <div>
                      <div className="form-label">산업 분야</div>
                      <input className="form-input" value={industry} onChange={(e) => setIndustry(e.target.value)} disabled={navLocked} />
                    </div>
                    <div>
                      <div className="form-label">중요도 (Priority)</div>
                      <select className="form-input" value={priority} onChange={(e) => setPriority(e.target.value)} disabled={navLocked}>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-label" style={{ marginTop: 10 }}>
                    공통 기술 스택 (Global Tech Stack)
                  </div>
                  <input
                    className="form-input"
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value)}
                    placeholder="Java, React, AWS"
                    disabled={navLocked}
                  />

                  <div className="sep" />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>역할 정의 및 요구사항 (Role Definitions)</div>
                    <button
                      type="button"
                      className="tm-add-role-btn"
                      onClick={openAddRole}
                      disabled={!projectId || loadingDetail || addRoleBusy || navLocked}
                    >
                      <span style={{ fontSize: 14, lineHeight: 1, fontWeight: 300 }}>+</span> 역할 추가
                    </button>
                  </div>
                  <div>
                    {roles.length === 0 ? (
                      <div style={{ fontSize: 12, color: "var(--text3)", padding: 10 }}>등록된 역할이 없습니다.</div>
                    ) : (
                      roles.map((r) => {
                        const skills = normalizeSkillArray(r.requiredSkills);
                        return (
                          <div
                            key={r.id}
                            style={{
                              background: "var(--bg4)",
                              border: "1px solid var(--border2)",
                              borderRadius: 8,
                              padding: 10,
                              marginBottom: 8,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent2)" }}>
                                {String(r.roleName ?? r.roleName ?? "-")}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text3)" }}>
                                <span>Lv: {String(r.level ?? "-")}</span>
                                <span>MM: {String(r.requiredMm ?? 0)}</span>
                                <span>Qty: {String(r.quantity ?? 0)}</span>
                                {Number(r.filled ?? 0) > 0 ? (
                                  <span style={{ color: "var(--green)" }}>{Number(r.filled ?? 0)}명 배정</span>
                                ) : null}
                                {Math.max(0, Number(r.quantity ?? 0) - Number(r.filled ?? 0)) > 0 ? (
                                  <span style={{ color: "var(--orange)" }}>
                                    {Math.max(0, Number(r.quantity ?? 0) - Number(r.filled ?? 0))}명 공석
                                  </span>
                                ) : null}
                                <button
                                  type="button"
                                  style={{
                                    color: "var(--accent2)",
                                    cursor: "pointer",
                                    fontSize: 11,
                                    background: "none",
                                    border: "none",
                                    padding: 0,
                                  }}
                                  onClick={() => void editRole(r)}
                                >
                                  수정
                                </button>
                                <button
                                  type="button"
                                  style={{ color: "var(--red)", cursor: "pointer", fontSize: 11, background: "none", border: "none", padding: 0 }}
                                  onClick={() => void deleteRole(r)}
                                >
                                  삭제
                                </button>
                              </div>
                            </div>
                            {skills.length > 0 ? (
                              <div className="tags" style={{ marginTop: 4 }}>
                                {skills.map((s, i) => (
                                  <span key={`${r.id}-${s}-${i}`} className="tag tag-skill">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="sep" />
                  <div style={{ background: "var(--bg4)", border: "1px solid var(--green)", borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--green)", marginBottom: 6 }}>인력 예산 설정 (Labor Budget)</div>
                    <div className="form-label">프로젝트 예산 한도</div>
                    <input
                      className="form-input"
                      value={budget}
                      type="text"
                      inputMode="numeric"
                      onChange={(e) => setBudget(formatWithComma(e.target.value))}
                      disabled={navLocked}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text3)", marginTop: 6 }}>
                      <span>예상 소요 비용</span>
                      <span style={{ color: "var(--yellow)" }}>
                        {utilPct}% 사용 (Est. ₩{Math.round(totalCost).toLocaleString("ko-KR")})
                      </span>
                    </div>
                    <div className="prog-bar" style={{ marginTop: 6 }}>
                      <div className="prog-fill" style={{ width: `${Math.min(Number(utilPct), 100)}%`, background: "var(--yellow)" }} />
                    </div>
                  </div>

                  {error ? (
                    <div style={{ fontSize: 12, color: "var(--red)", marginTop: 10 }}>{error}</div>
                  ) : null}
                  {message ? (
                    <div style={{ fontSize: 11, color: "var(--green)", marginTop: 10 }}>{message}</div>
                  ) : null}
                  <div style={{ marginTop: 14 }}>
                    <button
                      className="btn btn-green"
                      style={{ width: "100%", justifyContent: "center" }}
                      type="button"
                      onClick={() => void saveScope()}
                      disabled={!projectId || navLocked || !name.trim()}
                    >
                      {saving ? "저장 중…" : "저장 및 인력 매칭 시작"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 8 }}>선택 프로젝트: {selectedProjectName || "-"}</div>
        </div>
      </div>

      <ProtoTeamMgmtModal
        open={addRoleOpen}
        title="역할 추가"
        onCancel={() => {
          setAddRoleOpen(false);
          resetAddRoleForm();
        }}
        onConfirm={() => void saveAddRole()}
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
  );
}
