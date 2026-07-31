"use client";

import { useEffect, useState } from "react";
import { coerceStringList } from "@/shared/lib/jsonArrays";

export type ProtoPmCandidateRow = Record<string, unknown>;

function initials(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t.charAt(0);
}

function empIdOf(c: ProtoPmCandidateRow): number {
  const idRaw = c.id;
  return typeof idRaw === "number" ? idRaw : Number(idRaw);
}

function num(c: ProtoPmCandidateRow, key: string): number {
  const v = c[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

type Props = {
  candidates: ProtoPmCandidateRow[];
  proposingId: number | null;
  onPropose: (empId: number, matchScore: number) => void;
  onOpenProfile?: (empId: number, matchScore: number) => void;
  onSearchClick?: () => void;
};

/** prototype `PmCandidateProtoList` */
export function ProtoPmCandidateList({
  candidates,
  proposingId,
  onPropose,
  onOpenProfile,
  onSearchClick,
}: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    if (candidates.length === 0) {
      setExpanded(new Set());
      return;
    }
    const firstId = empIdOf(candidates[0]);
    const dup0 =
      Boolean(candidates[0]?.isDuplicated) || coerceStringList(candidates[0]?.currentProjects).length > 0;
    if (Number.isFinite(firstId) && !dup0) {
      setExpanded(new Set([firstId]));
    } else {
      setExpanded(new Set());
    }
  }, [candidates]);

  if (candidates.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 30, color: "var(--text3)" }}>
        매칭 결과가 없습니다. 가중치를 조정 후 다시 실행해주세요.
      </div>
    );
  }

  return (
    <>
      {candidates.map((c, idx) => {
        const id = empIdOf(c);
        const name = String(c.name ?? "");
        const winRateRaw = num(c, "win_rate");
        const winPct =
          c.winrate != null
            ? String(c.winrate)
            : `${Math.round(winRateRaw <= 1 ? winRateRaw * 100 : winRateRaw)}`;
        const score = Math.round(num(c, "totalScore"));
        const domScore = Math.min(100, Math.round(num(c, "domain_score")));
        const leadScore = Math.min(100, Math.round(num(c, "leadership_score")));
        const winScore = Math.min(100, Math.round(num(c, "winrate_score")));
        const reasons = coerceStringList(c.reasons);
        const skills = coerceStringList(c.skills);
        const curProjects = coerceStringList(c.currentProjects);
        const isDup = Boolean(c.isDuplicated) || curProjects.length > 0;
        const isBest = idx === 0 && !isDup;
        const isOpen = expanded.has(id);

        return (
          <div
            key={String(id)}
            role="button"
            tabIndex={0}
            className={"candidate-item pm-cand-card" + (isBest ? " selected" : "")}
            style={{
              position: "relative",
              flexDirection: "column",
              alignItems: "stretch",
              opacity: isDup ? 0.5 : 1,
            }}
            onClick={() =>
              setExpanded((prev) => {
                const next = new Set(prev);
                if (next.has(id)) {
                  next.delete(id);
                } else {
                  next.add(id);
                }
                return next;
              })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setExpanded((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) {
                    next.delete(id);
                  } else {
                    next.add(id);
                  }
                  return next;
                });
              }
            }}
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
                    textAlign: "center",
                  }}
                >
                  #{idx + 1}
                </div>
              )}
              <div
                className="cand-avatar"
                style={
                  isBest
                    ? { background: "var(--accent-light)", color: "var(--accent2)", fontWeight: 700 }
                    : undefined
                }
              >
                {initials(name)}
              </div>
              <div className="cand-info">
                <div>
                  <span className="cand-name">{name || "—"}</span>
                  <span className="cand-cl">{String(c.cl ?? "")}</span>
                </div>
                <div className="cand-role">
                  {String(c.role ?? "")} · {String(c.team ?? "")}
                </div>
              </div>
              <div className="cand-scores">
                <div className="score-win">{winPct}%</div>
                <div style={{ fontSize: 9, color: "var(--text3)" }}>수주율</div>
                <div className="score-main">{score}</div>
                <div style={{ fontSize: 9, color: "var(--text3)" }}>적합도</div>
              </div>
              <div style={{ fontSize: 10, color: "var(--text3)", marginLeft: 4 }}>{isOpen ? "▴" : "▾"}</div>
            </div>

            {isOpen ? (
              <div style={{ marginTop: 10 }}>
                <div className="match-viz">
                  <div className="match-node" style={{ fontSize: 10 }}>
                    🏗<br />
                    Project
                    <br />
                    Reqs
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="match-bar-row">
                      <span className="match-bar-label">도메인 적합성</span>
                      <div className="match-bar">
                        <div className="match-bar-fill" style={{ width: `${domScore}%`, background: "var(--blue)" }} />
                      </div>
                      <span style={{ fontSize: 10, color: "var(--blue)", marginLeft: 4 }}>{domScore}%</span>
                    </div>
                    <div className="match-bar-row">
                      <span className="match-bar-label">리더십 (직급)</span>
                      <div className="match-bar">
                        <div className="match-bar-fill" style={{ width: `${leadScore}%`, background: "var(--accent)" }} />
                      </div>
                      <span style={{ fontSize: 10, color: "var(--accent2)", marginLeft: 4 }}>{leadScore}%</span>
                    </div>
                    <div className="match-bar-row">
                      <span className="match-bar-label">수주 이력</span>
                      <div className="match-bar">
                        <div className="match-bar-fill" style={{ width: `${winScore}%`, background: "var(--green)" }} />
                      </div>
                      <span style={{ fontSize: 10, color: "var(--green)", marginLeft: 4 }}>{winScore}%</span>
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
                  <div className="ai-reason-title">⚡ AI Recommendation Reasoning</div>
                  <div>
                    {reasons.length > 0 ? reasons.join(", ") : "프로젝트 요건과 매칭도를 보입니다."}
                  </div>
                </div>

                {isDup ? (
                  <div
                    style={{
                      marginTop: 6,
                      padding: "6px 10px",
                      background: "var(--red-light)",
                      border: "1px solid color-mix(in srgb, var(--red) 30%, transparent)",
                      borderRadius: 6,
                      fontSize: 11,
                      color: "var(--red)",
                    }}
                  >
                    현재 PM 배정중: {curProjects.join(", ")} (PM은 1인 1프로젝트)
                  </div>
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

                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (Number.isFinite(id)) {
                        onOpenProfile?.(id, score);
                      }
                    }}
                  >
                    🔍 상세 프로파일
                  </button>
                  {isDup ? (
                    <button type="button" className="btn btn-sm" disabled style={{ opacity: 0.4, cursor: "not-allowed" }}>
                      PM 배정 불가 (타 프로젝트)
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-green btn-sm"
                      disabled={!Number.isFinite(id) || proposingId === id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPropose(id, num(c, "totalScore"));
                      }}
                    >
                      {proposingId === id ? "제안 중…" : "이 PM으로 후보 지명 →"}
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}

      <div
        role="button"
        tabIndex={0}
        className="candidate-item"
        style={{
          border: "1.5px dashed var(--border2)",
          justifyContent: "center",
          gap: 8,
          color: "var(--accent2)",
          background: "transparent",
          cursor: onSearchClick ? "pointer" : "default",
        }}
        onClick={() => onSearchClick?.()}
        onKeyDown={(e) => {
          if (onSearchClick && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onSearchClick();
          }
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 300, lineHeight: 1 }}>+</span>
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>인력 검색하기</span>
        <span style={{ fontSize: 11, color: "var(--text3)" }}>직접 후보 탐색</span>
      </div>

      <div
        style={{
          fontSize: 11,
          color: "var(--text3)",
          textAlign: "center",
          marginTop: 8,
          padding: 6,
          background: "var(--bg4)",
          borderRadius: 6,
        }}
      >
        💡 인력 카드를 클릭하면 상세 프로파일을 확인할 수 있습니다
      </div>
    </>
  );
}
