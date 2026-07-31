"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ProtoLoadingOverlay } from "@/features/proto/components/shared/ProtoLoadingOverlay";
import { protoQueryService } from "@/features/proto/services/protoQueryService";
import type { ProtoEmployeeItem } from "@/features/proto/types";
import styles from "./ProtoEmployeesPanel.module.css";

type EmployeeDetail = ProtoEmployeeItem & Record<string, unknown>;

const PROFILE_FIELDS: Array<{ key: string; label: string }> = [
  { key: "empNo", label: "사번" },
  { key: "name", label: "이름" },
  { key: "role", label: "역할" },
  { key: "cl", label: "CL" },
  { key: "division", label: "본부" },
  { key: "team", label: "팀" },
  { key: "skills", label: "스킬" },
  { key: "domainExpertise", label: "도메인 경험" },
  { key: "careerYears", label: "근속년수" },
  { key: "performanceScore", label: "성과지표" },
  { key: "monthlyCost", label: "비용" },
  { key: "isAvailable", label: "가용여부" },
];

function toText(v: unknown): string {
  return v == null ? "" : String(v);
}

function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatAvailable(v: unknown): string {
  const s = toText(v).trim().toLowerCase();
  if (s === "true" || s === "t") return "Y";
  if (s === "false" || s === "f") return "N";
  if (s === "y" || s === "true" || s === "1") return "Y";
  if (s === "n" || s === "false" || s === "0") return "N";
  return "—";
}

function formatWon(v: unknown): string {
  const n = toNum(v);
  if (n == null) return "—";
  return `₩${Math.round(n).toLocaleString("ko-KR")}`;
}

function coerceStringList(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .map((item) => toText(item).trim())
      .filter(Boolean);
  }
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return [];
    if (t.startsWith("[") && t.endsWith("]")) {
      try {
        const parsed = JSON.parse(t);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => toText(item).trim()).filter(Boolean);
        }
      } catch {
        return t
          .replace(/^\[|\]$/g, "")
          .split(",")
          .map((item) => item.replace(/^["'\s]+|["'\s]+$/g, "").trim())
          .filter(Boolean);
      }
    }
    return t
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function formatProfileValue(key: string, value: unknown): string {
  if (value == null) return "—";
  if (key === "monthlyCost") return formatWon(value);
  if (key === "isAvailable") return formatAvailable(value);
  if (key === "careerYears") {
    const n = toNum(value);
    return n == null ? "—" : `${n}년`;
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? "—" : value.map((item) => toText(item)).join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return toText(value);
}

function renderProfileValue(key: string, value: unknown) {
  if (key === "skills" || key === "domainExpertise") {
    const items = coerceStringList(value);
    if (items.length === 0) return <span>—</span>;
    return (
      <ul className={styles.tagList}>
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className={styles.tag}>
            {item}
          </li>
        ))}
      </ul>
    );
  }
  return <span>{formatProfileValue(key, value)}</span>;
}

export default function ProtoEmployeesPanel() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [team, setTeam] = useState("");
  const [division, setDivision] = useState("");
  const [available, setAvailable] = useState("");
  const [items, setItems] = useState<ProtoEmployeeItem[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedId = useMemo(() => {
    const id = selectedDetail?.id;
    return typeof id === "number" ? id : null;
  }, [selectedDetail]);

  const availableCount = useMemo(
    () =>
      items.filter((item) => formatAvailable(item.isAvailable ?? item.available) === "Y").length,
    [items],
  );

  const load = useCallback(async (filters?: {
    role?: string;
    available?: string;
    name?: string;
    skills?: string;
    team?: string;
    division?: string;
  }) => {
    try {
      setLoading(true);
      setError("");
      const response = await protoQueryService.getEmployees(filters);
      setItems(response);
      setSelectedDetail(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "직원 조회 실패";
      setError(message);
      setItems([]);
      setSelectedDetail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSearch = async (): Promise<void> => {
    await load({
      role: role || undefined,
      available: available || undefined,
      name: name || undefined,
      skills: skills || undefined,
      team: team || undefined,
      division: division || undefined,
    });
  };

  const handleLoadDetail = async (id: number): Promise<void> => {
    try {
      setDetailLoading(true);
      setError("");
      const detail = await protoQueryService.getEmployeeDetail(id);
      setSelectedDetail(detail as EmployeeDetail);
    } catch (e) {
      const message = e instanceof Error ? e.message : "직원 상세 조회 실패";
      setError(message);
      setSelectedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const shownKeys = useMemo(() => new Set(PROFILE_FIELDS.map((f) => f.key)), []);
  const extraFields = useMemo(() => {
    if (!selectedDetail) return [];
    return Object.keys(selectedDetail).filter((key) => !shownKeys.has(key));
  }, [selectedDetail, shownKeys]);

  const overlayBusy = loading || detailLoading;

  return (
    <div aria-busy={overlayBusy}>
      <ProtoLoadingOverlay active={overlayBusy} />
      <section className={`teaming-proto ${styles.page}`}>
        <div className="tm-summary-bar">
          <div>
            <div className={styles.summaryTitle}>직원 보관함</div>
            <div className={styles.summaryDesc}>검색 결과에서 직원을 선택하면 우측에 상세 프로필이 표시됩니다.</div>
          </div>
          <div className={styles.summaryKpis}>
            <div>
              <div className={styles.summaryLabel}>검색 결과</div>
              <div className={styles.summaryValue}>{items.length}명</div>
            </div>
            <div>
              <div className={styles.summaryLabel}>표시 중 가용</div>
              <div className={styles.summaryValueSuccess}>{availableCount}명</div>
            </div>
          </div>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={`panel ${styles.searchPanel}`}>
          <div className="panel-header">
            <div className="panel-title">검색 조건</div>
            <span className="chip chip-pre-sales">Filter</span>
          </div>
          <div className={`panel-body ${styles.searchPanelBody}`}>
            <div className={styles.filters}>
              <label className={styles.filterCell}>
                <span className={styles.fieldLabel}>이름</span>
                <input
                  className={styles.field}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="부분 일치"
                />
              </label>
              <label className={styles.filterCell}>
                <span className={styles.fieldLabel}>역할</span>
                <input
                  className={styles.field}
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  placeholder="부분 일치"
                />
              </label>
              <label className={styles.filterCell}>
                <span className={styles.fieldLabel}>스킬</span>
                <input
                  className={styles.field}
                  value={skills}
                  onChange={(event) => setSkills(event.target.value)}
                />
              </label>
              <label className={styles.filterCell}>
                <span className={styles.fieldLabel}>팀</span>
                <input
                  className={styles.field}
                  value={team}
                  onChange={(event) => setTeam(event.target.value)}
                />
              </label>
              <label className={styles.filterCell}>
                <span className={styles.fieldLabel}>본부</span>
                <input
                  className={styles.field}
                  value={division}
                  onChange={(event) => setDivision(event.target.value)}
                />
              </label>
              <div className={`${styles.filterCell} ${styles.availableCell}`}>
                <label className={styles.availableSelectWrap}>
                  <span className={styles.fieldLabel}>가용여부</span>
                  <select
                    className={styles.field}
                    value={available}
                    onChange={(event) => setAvailable(event.target.value)}
                    aria-label="가용 여부"
                  >
                    <option value="">전체</option>
                    <option value="true">Y</option>
                    <option value="false">N</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => void handleSearch()}
                  disabled={overlayBusy}
                >
                  {loading ? "검색 중…" : "검색 실행"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.split}>
          <div className={styles.listCol}>
            <div className={`panel ${styles.fillPanel}`}>
              <div className="panel-header">
                <div className="panel-title">검색 결과</div>
                <span className={styles.countText}>{items.length > 0 ? `${items.length}건` : "—"}</span>
              </div>
              <div className={`panel-body ${styles.resultsBody}`}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>사번</th>
                        <th>이름</th>
                        <th>역할</th>
                        <th>CL</th>
                        <th>본부</th>
                        <th>팀</th>
                        <th>가용여부</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          className={selectedId === item.id ? styles.rowActive : styles.row}
                          onClick={() => void handleLoadDetail(item.id)}
                        >
                          <td>{toText(item.empNo) || "—"}</td>
                          <td>{item.name || "—"}</td>
                          <td>{item.role || "—"}</td>
                          <td>{toText(item.cl) || "—"}</td>
                          <td>{item.division || "—"}</td>
                          <td>{item.team || "—"}</td>
                          <td>{formatAvailable(item.isAvailable ?? item.available)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!loading && !error && items.length === 0 ? (
                  <p className={styles.empty}>조건에 맞는 직원이 없습니다.</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className={styles.profileCol}>
            <div className={`panel ${styles.fillPanel}`}>
              <div className="panel-header">
                <div className="panel-title">직원 프로필</div>
                {selectedDetail ? (
                  <button type="button" className="btn btn-sm" onClick={() => setSelectedDetail(null)}>
                    닫기
                  </button>
                ) : null}
              </div>
              <div className={`panel-body ${styles.profileBody}`}>
                {selectedDetail ? (
                  <div className={styles.profile}>
                    <dl className={styles.profileGrid}>
                      {PROFILE_FIELDS.map(({ key, label }) => (
                        <div key={key} className={styles.profileRow}>
                          <dt>{label}</dt>
                          <dd>{renderProfileValue(key, selectedDetail[key])}</dd>
                        </div>
                      ))}
                    </dl>
                    {extraFields.length > 0 ? (
                      <details className={styles.raw}>
                        <summary>기타 필드 (JSON)</summary>
                        <pre className={styles.pre}>
                          {JSON.stringify(
                            extraFields.reduce<Record<string, unknown>>((acc, key) => {
                              acc[key] = selectedDetail[key];
                              return acc;
                            }, {}),
                            null,
                            2,
                          )}
                        </pre>
                      </details>
                    ) : null}
                  </div>
                ) : (
                  <div className={styles.placeholder}>좌측 목록에서 직원을 선택하면 프로필이 표시됩니다.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
