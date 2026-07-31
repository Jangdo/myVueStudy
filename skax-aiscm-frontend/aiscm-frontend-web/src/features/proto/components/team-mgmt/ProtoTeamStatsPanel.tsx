"use client";

import { useCallback, useEffect, useState } from "react";
import { protoQueryService } from "@/features/proto/services/protoQueryService";
import type { ProtoTeamStatsData } from "@/features/proto/types";
import shared from "../shared/protoPanelShared.module.css";

export default function ProtoTeamStatsPanel() {
  const [projectIdInput, setProjectIdInput] = useState("1001");
  const [data, setData] = useState<ProtoTeamStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (projectId?: number) => {
    try {
      setLoading(true);
      setError("");
      const response = await protoQueryService.getTeamStats(projectId);
      setData(response);
    } catch (e) {
      const message = e instanceof Error ? e.message : "팀 통계 조회 실패";
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1001);
  }, [load]);

  const handleSearch = async (): Promise<void> => {
    const n = Number(projectIdInput);
    if (!Number.isFinite(n)) {
      setError("projectId는 숫자여야 합니다.");
      return;
    }
    await load(n);
  };

  return (
    <section className={shared.page}>
      <div className={shared.toolbar}>
        <input className={shared.control} value={projectIdInput} onChange={(event) => setProjectIdInput(event.target.value)} aria-label="projectId" />
        <button type="button" className={shared.btn} onClick={() => void handleSearch()} disabled={loading}>
          조회
        </button>
      </div>
      {loading ? <p className={shared.hint}>팀 통계 조회 중…</p> : null}
      {error ? <p className={shared.err}>오류: {error}</p> : null}
      {!loading && !error && data ? (
        <ul className={`${shared.list} ${shared.listTight}`}>
          <li>projectId: {data.projectId}</li>
          <li>headcount: {data.headcount}</li>
          <li>assigned: {data.assigned}</li>
          <li>pending: {data.pending}</li>
          <li>utilization: {data.utilization}%</li>
        </ul>
      ) : null}
    </section>
  );
}
