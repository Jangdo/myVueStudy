"use client";

import { useEffect, useState } from "react";
import { coerceStringList } from "@/features/proto/lib/coerceStringList";

export type ProtoMatchCandidateRow = Record<string, unknown>;

function initials(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t.charAt(0);
}

function empIdOf(c: ProtoMatchCandidateRow): number {
  const idRaw = c.id;
  return typeof idRaw === "number" ? idRaw : Number(idRaw);
}

function totalScoreOf(c: ProtoMatchCandidateRow): number {
  const raw = c.totalScore;
  return typeof raw === "number" ? raw : Number(raw ?? 0);
}

function num(c: ProtoMatchCandidateRow, key: string): number {
  const v = c[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

type Props = {
  candidates: ProtoMatchCandidateRow[];
  proposingId: number | null;
  onPropose: (empId: number, matchScore: number) => void;
  proposingLabel?: string;
  disablePropose?: boolean;
  extraScoreKeys?: Array<{ key: string; label: string }>;
};

/** prototype `MatchingCandidateCards` — teaming `.match-cand-*` 사용 */
export function ProtoMatchingCandidateCards({
  candidates,
  proposingId,
  onPropose,
  proposingLabel = "배정 제안",
  disablePropose = false,
  extraScoreKeys,
}: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (candidates.length === 0) {
      setSelectedId(null);
      return;
    }
    const id = empIdOf(candidates[0]);
    setSelectedId(Number.isFinite(id) ? id : null);
  }, [candidates]);

  return (
    <div className="match-cand-grid">
      {candidates.map((c, idx) => {
        const id = empIdOf(c);
        const name = String(c.name ?? "");
        const scoreRaw = totalScoreOf(c);
        const score = Math.round(scoreRaw);
        const selected = selectedId === id;
        const availabilityScore = Math.min(100, Math.round(num(c, "availabilityScore")));
        const skillScore = Math.min(100, Math.round(num(c, "skillScore")));
        const historyScore = Math.min(100, Math.round(num(c, "historyScore")));
        const reasons = coerceStringList(c.reasons);
        const skills = coerceStringList(c.skills);
        const currentProjects = coerceStringList(c.currentProjects);
        const isBlocked = currentProjects.length > 0;
        const isBest = idx === 0 && !isBlocked;
        return (
          <div
            key={String(id)}
            role="button"
            tabIndex={0}
            className={"candidate-item pm-cand-card" + (selected ? " selected" : "")}
            style={{ position: "relative", flexDirection: "column", alignItems: "stretch", opacity: isBlocked ? 0.55 : 1 }}
            onClick={() => setSelectedId(Number.isFinite(id) ? id : null)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedId(Number.isFinite(id) ? id : null);
              }
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {isBest ? (
                <div className="best-badge">Best</div>
              ) : (
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", minWidth: 18, textAlign: "center" }}>#{idx + 1}</div>
              )}
              <div className="cand-avatar" style={selected ? { background: "var(--accent-light)", color: "var(--accent2)", fontWeight: 700 } : undefined}>
                {initials(name)}
              </div>
              <div className="cand-info">
                <div>
                  <span className="cand-name">{name || "—"}</span>
                  <span className="cand-cl">{String(c.cl ?? "")}</span>
                </div>
                <div className="cand-role">{String(c.role ?? "")} · {String(c.team ?? "")}</div>
              </div>
              <div className="cand-scores">
                <div className="score-win">{availabilityScore}</div>
                <div style={{ fontSize: 9, color: "var(--text3)" }}>가용</div>
                <div className="score-main">{score}</div>
                <div style={{ fontSize: 9, color: "var(--text3)" }}>적합도</div>
              </div>
            </div>

            {selected ? (
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

                {currentProjects.length > 0 ? (
                  <div className="team-mgmt-match-card__risk">현재 투입 프로젝트: {currentProjects.join(", ")}</div>
                ) : null}

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

            <div className="match-cand-card__scores">
              {extraScoreKeys?.map(({ key, label }) =>
                c[key] != null ? (
                  <span key={key}>
                    {label} {String(c[key])}
                  </span>
                ) : null,
              )}
            </div>
            <div className="match-cand-card__actions">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={!Number.isFinite(id) || proposingId === id || disablePropose || isBlocked}
                onClick={(e) => {
                  e.stopPropagation();
                  onPropose(id, Number.isFinite(scoreRaw) ? scoreRaw : 0);
                }}
              >
                {isBlocked ? "배정 불가" : proposingId === id ? "제안 중" : proposingLabel}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
