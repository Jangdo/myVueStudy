"use client";

import { useState } from "react";
import shared from "../shared/protoPanelShared.module.css";

type PlaygroundScenario = {
  id: string;
  title: string;
  role: "AM" | "PM" | "BL" | "SL";
  description: string;
};

const scenarios: PlaygroundScenario[] = [
  { id: "pm-assign", title: "PM 배정 승인", role: "BL", description: "PM 후보 제안 후 승인 라우팅 확인" },
  { id: "team-replace", title: "팀원 교체 요청", role: "SL", description: "replace 상태 전이와 후속 매칭 확인" },
  { id: "scope-change", title: "스코프 변경", role: "AM", description: "프로젝트 스코프 저장/재조회 동작 확인" },
];

export default function ProtoPlaygroundPanel() {
  const [inputValue, setInputValue] = useState("");
  const [role, setRole] = useState<"AM" | "PM" | "BL" | "SL">("AM");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState("pm-assign");
  const [toast, setToast] = useState("");

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId) ?? scenarios[0];

  const runScenario = (): void => {
    const message = `시나리오 실행: ${selectedScenario.title} / role=${role} / 입력="${inputValue || "-"}"`;
    setToast(message);
    setModalOpen(true);
  };

  return (
    <section className={shared.page}>
      <p className={shared.lead}>prototype의 UI 샘플 영역을 `/proto`에서 확인하기 위한 페이지입니다.</p>

      <div className={`${shared.stack8} ${shared.maxW520}`}>
        <input
          className={shared.control}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="샘플 입력"
        />
        <select
          className={shared.control}
          value={role}
          onChange={(e) => setRole(e.target.value as "AM" | "PM" | "BL" | "SL")}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
          <option value="BL">BL</option>
          <option value="SL">SL</option>
        </select>
        <select
          className={shared.control}
          value={selectedScenarioId}
          onChange={(e) => {
            const id = e.target.value;
            const next = scenarios.find((s) => s.id === id);
            setSelectedScenarioId(id);
            if (next) setRole(next.role);
          }}
        >
          {scenarios.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.title}
            </option>
          ))}
        </select>
        <p className={shared.scenarioDesc}>{selectedScenario.description}</p>
        <div className={shared.flexRow}>
          <button type="button" className={shared.btn} onClick={runScenario}>
            시나리오 실행
          </button>
          <button type="button" className={shared.btn} onClick={() => setModalOpen(true)}>
            모달 열기
          </button>
          <button type="button" className={shared.btn} onClick={() => setInputValue("")}>
            입력 초기화
          </button>
        </div>
      </div>

      {toast ? <p className={shared.toastOk}>{toast}</p> : null}

      {modalOpen ? (
        <div className={shared.modalBox}>
          <strong className={shared.modalStrong}>샘플 모달</strong>
          <p className={shared.modalP}>
            value={inputValue || "-"}, role={role}
          </p>
          <p className={shared.modalP}>scenario={selectedScenario.title}</p>
          <button type="button" className={shared.btn} onClick={() => setModalOpen(false)}>
            닫기
          </button>
        </div>
      ) : null}
    </section>
  );
}
