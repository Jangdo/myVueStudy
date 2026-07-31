"use client";

import { useCallback, useEffect, useState } from "react";
import { protoCommandService } from "@/features/proto/services/protoCommandService";
import { protoQueryService } from "@/features/proto/services/protoQueryService";
import type { ProtoMatchingLogItem } from "@/features/proto/types";
import shared from "../shared/protoPanelShared.module.css";

export default function ProtoMatchingLogsPanel() {
  const [projectIdInput, setProjectIdInput] = useState("1001");
  const [items, setItems] = useState<ProtoMatchingLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [matchingType, setMatchingType] = useState("PM");
  const [scoreDraft, setScoreDraft] = useState("88");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async (projectId?: number) => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const response = await protoQueryService.getMatchingLogs(projectId);
      const sorted = [...response].sort((a, b) => b.id - a.id);
      setItems(sorted);
    } catch (e) {
      const messageText = e instanceof Error ? e.message : "매칭 로그 조회 실패";
      setError(messageText);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1001);
  }, [load]);

  const handleSearch = async (): Promise<void> => {
    if (!projectIdInput.trim()) {
      setError("projectId는 필수입니다.");
      return;
    }
    const n = Number(projectIdInput);
    if (!Number.isFinite(n)) {
      setError("projectId는 숫자여야 합니다.");
      return;
    }
    await load(n);
  };

  const handleCreateLog = async (): Promise<void> => {
    if (!projectIdInput.trim()) {
      setError("projectId는 필수입니다.");
      return;
    }
    const n = Number(projectIdInput);
    if (!Number.isFinite(n)) {
      setError("projectId는 숫자여야 합니다.");
      return;
    }
    const scoreNum = Number(scoreDraft);
    if (!Number.isFinite(scoreNum)) {
      setError("score는 숫자여야 합니다.");
      return;
    }
    try {
      setCreating(true);
      setError("");
      setMessage("");
      const created = await protoCommandService.createMatchingLog({
        projectId: n,
        matchingType,
        weights: "{}",
        results: JSON.stringify({ score: scoreNum }),
        createdBy: "proto-ui",
      });
      setMessage(`로그 생성 완료: id=${created.id}, project=${created.projectId}`);
      await load(n);
    } catch (e) {
      const messageText = e instanceof Error ? e.message : "매칭 로그 저장 실패";
      setError(messageText);
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className={shared.page}>
      <div className={shared.toolbar}>
        <input
          className={shared.control}
          type="text"
          placeholder="projectId (예: 1001)"
          value={projectIdInput}
          onChange={(event) => setProjectIdInput(event.target.value)}
        />
        <button type="button" className={shared.btn} onClick={() => void handleSearch()} disabled={loading}>
          조회
        </button>
      </div>
      <div className={shared.writeStrip}>
        <span className={shared.writeStripLabel}>쓰기 샘플(단계4):</span>
        <label className={shared.labelInline}>
          유형
          <select className={shared.control} value={matchingType} onChange={(e) => setMatchingType(e.target.value)}>
            <option value="PM">PM</option>
            <option value="TEAM">TEAM</option>
          </select>
        </label>
        <label className={shared.labelInline}>
          score
          <input className={`${shared.control} ${shared.w56}`} type="text" value={scoreDraft} onChange={(e) => setScoreDraft(e.target.value)} />
        </label>
        <button type="button" className={shared.btn} onClick={() => void handleCreateLog()} disabled={loading || creating}>
          로그 추가
        </button>
      </div>
      {loading ? <p className={shared.hint}>매칭 로그 조회 중…</p> : null}
      {error ? <p className={shared.err}>오류: {error}</p> : null}
      {message ? <p className={shared.success}>{message}</p> : null}
      {!loading && !error && items.length === 0 ? <p className={shared.muted}>매칭 로그가 없습니다.</p> : null}
      {!loading && !error && items.length > 0 ? (
        <ul className={`${shared.list} ${shared.listTight}`}>
          {items.map((item) => (
            <li key={item.id}>
              #{item.id} project={item.projectId} type={item.matchType} score={item.score}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
