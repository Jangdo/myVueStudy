"use client";

import { useMemo, useState } from "react";
import shared from "../shared/protoPanelShared.module.css";

export default function ProtoExternalPanel() {
  const [provider, setProvider] = useState("Workday");
  const [authType, setAuthType] = useState("OAuth2");
  const [baseUrl, setBaseUrl] = useState("https://api.external-hr.example");
  const [syncTarget, setSyncTarget] = useState({
    employee: true,
    application: true,
    offer: false,
  });
  const [syncCycle, setSyncCycle] = useState("15m");
  const [dryRun, setDryRun] = useState(true);
  const [resultLog, setResultLog] = useState<string[]>([]);

  const targetText = useMemo(() => {
    const list: string[] = [];
    if (syncTarget.employee) list.push("직원");
    if (syncTarget.application) list.push("지원");
    if (syncTarget.offer) list.push("오퍼");
    return list.length > 0 ? list.join(", ") : "선택 없음";
  }, [syncTarget]);

  const runSync = (): void => {
    const now = new Date().toLocaleString();
    const line = `[${now}] ${provider} / ${authType} / ${syncCycle} / 대상: ${targetText} / mode=${dryRun ? "dry-run" : "commit"}`;
    setResultLog((prev) => [line, ...prev].slice(0, 8));
  };

  return (
    <section className={shared.page}>
      <p className={shared.lead}>
        ATS/외부 HR 연동 자리입니다. 아직 전용 API는 없고, prototype처럼 설정/시나리오 검증 중심으로 동작합니다.
      </p>
      <div className={shared.stack10}>
        <div className={shared.card}>
          <strong className={shared.simulatorTitle}>연동 설정 시뮬레이터</strong>
          <div className={shared.simulatorStack}>
            <select className={shared.control} value={provider} onChange={(e) => setProvider(e.target.value)}>
              <option value="Workday">Workday</option>
              <option value="SAP SuccessFactors">SAP SuccessFactors</option>
              <option value="Greenhouse">Greenhouse</option>
            </select>
            <select className={shared.control} value={authType} onChange={(e) => setAuthType(e.target.value)}>
              <option value="OAuth2">OAuth2</option>
              <option value="API Key">API Key</option>
              <option value="Basic Auth">Basic Auth</option>
            </select>
            <input className={shared.control} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="Base URL" />
            <div className={shared.flexWrap}>
              <label>
                <input type="checkbox" checked={syncTarget.employee} onChange={(e) => setSyncTarget((p) => ({ ...p, employee: e.target.checked }))} />{" "}
                직원
              </label>
              <label>
                <input type="checkbox" checked={syncTarget.application} onChange={(e) => setSyncTarget((p) => ({ ...p, application: e.target.checked }))} />{" "}
                지원
              </label>
              <label>
                <input type="checkbox" checked={syncTarget.offer} onChange={(e) => setSyncTarget((p) => ({ ...p, offer: e.target.checked }))} /> 오퍼
              </label>
            </div>
            <select className={shared.control} value={syncCycle} onChange={(e) => setSyncCycle(e.target.value)}>
              <option value="5m">5분</option>
              <option value="15m">15분</option>
              <option value="1h">1시간</option>
              <option value="manual">수동</option>
            </select>
            <label>
              <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} /> dry-run 모드
            </label>
            <button type="button" className={shared.btn} onClick={runSync} disabled={!baseUrl.trim()}>
              동기화 시뮬레이션 실행
            </button>
          </div>
        </div>
        <div className={shared.card}>
          <strong className={shared.simulatorTitle}>실행 로그</strong>
          {resultLog.length === 0 ? (
            <p className={shared.muted}>실행 로그가 없습니다.</p>
          ) : (
            <ul className={shared.logList}>
              {resultLog.map((line, idx) => (
                <li key={`${line}-${idx}`}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
