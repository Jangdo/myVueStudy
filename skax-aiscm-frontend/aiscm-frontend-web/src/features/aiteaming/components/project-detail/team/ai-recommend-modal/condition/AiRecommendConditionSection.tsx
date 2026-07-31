import {
  type RecommendMembersWeight,
  type RecommendViewLimit,
  weightStateToRecommendMembersWeight,
} from "@/features/aiteaming/types/matchingMembers";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { INITIAL_CONDITION_DRAFT } from "./mock";
import { cloneExcludeTree } from "./orgTreeMap";
import type { ConditionTab, ExcludeDivisionNode, ViewCount, WeightKey } from "./types";
import {
  extractExcludedOrgIds,
  flattenCheckedTagItems,
  getDivisionTriState,
  getHeadTriState,
  recommendWeightsRowsToWeightState,
  removeExcludeTagItem,
  toggleDivision,
  toggleHead,
  toggleTeam,
  type OrgTriState,
} from "./utils";
import styles from "./AiRecommendConditionSection.module.css";

export interface AiRecommendConditionSectionProps {
  assignRole: string;
  detailsOpen: boolean;
  onToggleDetails: () => void;
  /**
   * `undefined`: 모달에서 조직 API 로딩 중.
   * 배열: 로드 완료(빈 배열이면 조직 없음).
   */
  loadedExcludeTree: ExcludeDivisionNode[] | undefined;
  /** 조직 API 실패 시 메시지 */
  excludeOrgError?: string | null;
  /**
   * 투입인력 행 `ProjectMember.jobCmptCntn` 기반 직무역량·제약조건 목록.
   * 전달 시 `draft`/`applied`의 `constraintLines`와 동기화한다.
   */
  roleConstraintLines?: string[];
  /**
   * `getSavedWeights` + `mapMatchingWeightsToRecommendWeights` 결과.
   * `undefined` 이면 가중치 슬라이더는 초기 mock 유지.
   */
  matchingWeights?: RecommendMembersWeight[];
  /**
   * 「설정 적용」: draft 가중치·제외 orgId 만으로 매칭 POST 를 하도록 부모에 전달 (getSavedWeights / 제외 API 재조회 없음).
   */
  onApplyRecommendConditions?: (payload: {
    weights: RecommendMembersWeight[];
    excludeOrgIds: string[];
    /** 보기 설정 N명 — API `viewLimit`. DB 저장 추후. */
    viewLimit: RecommendViewLimit;
  }) => void;
  /** 부모가 가중치·제외 조직 DB 재조회 후 증가시키면 동기화 ref 를 비워 서버 값으로 draft 를 다시 맞춘다. */
  serverBaselineEpoch?: number;
  /** 새로고침: DB 저장 가중치·제외 조직 재조회 후 폼 초기화 */
  onRequestServerBaselineReset?: () => void | Promise<void>;
}

const TAB_OPTIONS: Array<{ id: ConditionTab; label: string }> = [
  { id: "weight", label: "가중치 조정" },
  { id: "constraint", label: "직무역량 및 제약조건" },
  { id: "exclude", label: "제외 항목 설정" },
];

const VIEW_COUNT_OPTIONS: ViewCount[] = [5, 10, 15];

function OrgTriCheckbox({
  state,
  onChange,
  ariaLabel,
}: {
  state: OrgTriState;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.indeterminate = state === "indeterminate";
    }
  }, [state]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className={styles.orgTriCheckbox}
      checked={state === "checked"}
      onChange={(event) => onChange(event.target.checked)}
      aria-label={ariaLabel}
    />
  );
}

function OrgLeafCheckbox({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <input
      type="checkbox"
      className={styles.orgTriCheckbox}
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      aria-label={ariaLabel}
    />
  );
}

function IconSliders() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 4h12M2 8h8M2 12h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="11" cy="4" r="1.5" fill="currentColor" />
      <circle cx="6" cy="8" r="1.5" fill="currentColor" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconChevronUp() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M6 12l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
/** Figma Atomic/Neutral/400 #9AA1AD 계열 — 태그 삭제(제외 해제) */
function IconTagRemove() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M3 3l6 6M9 3l-6 6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M11.7 7a4.7 4.7 0 1 1-1.1-3M11.7 3.1v2.8H8.9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AiRecommendConditionSection({
  assignRole,
  detailsOpen,
  onToggleDetails,
  loadedExcludeTree,
  excludeOrgError = null,
  roleConstraintLines,
  matchingWeights,
  onApplyRecommendConditions,
  serverBaselineEpoch = 0,
  onRequestServerBaselineReset,
}: AiRecommendConditionSectionProps) {
  const [draft, setDraft] = useState(INITIAL_CONDITION_DRAFT);
  const [applied, setApplied] = useState(INITIAL_CONDITION_DRAFT);
  const [selectedDivisionId, setSelectedDivisionId] = useState("");
  const [selectedHeadId, setSelectedHeadId] = useState("");

  const syncedOrgPayloadRef = useRef<string>("");
  const syncedConstraintSigRef = useRef<string>("");
  const syncedMatchingWeightsSigRef = useRef<string>("");

  useEffect(() => {
    if (matchingWeights === undefined) {
      syncedMatchingWeightsSigRef.current = "";
      return;
    }
    const sig = JSON.stringify(matchingWeights);
    if (syncedMatchingWeightsSigRef.current === sig) {
      return;
    }
    syncedMatchingWeightsSigRef.current = sig;
    const nextWeight = recommendWeightsRowsToWeightState(matchingWeights);
    if (nextWeight == null) {
      return;
    }
    setDraft((prev) => ({ ...prev, weight: nextWeight }));
    setApplied((prev) => ({ ...prev, weight: nextWeight }));
  }, [matchingWeights]);

  useEffect(() => {
    if (roleConstraintLines === undefined) {
      syncedConstraintSigRef.current = "";
      return;
    }
    const sig = JSON.stringify(roleConstraintLines);
    if (syncedConstraintSigRef.current === sig) {
      return;
    }
    syncedConstraintSigRef.current = sig;
    setDraft((prev) => ({ ...prev, constraintLines: roleConstraintLines }));
    setApplied((prev) => ({ ...prev, constraintLines: roleConstraintLines }));
  }, [roleConstraintLines]);

  useEffect(() => {
    if (loadedExcludeTree === undefined) {
      syncedOrgPayloadRef.current = "";
      return;
    }
    const sig = JSON.stringify(loadedExcludeTree);
    if (syncedOrgPayloadRef.current === sig) {
      return;
    }
    syncedOrgPayloadRef.current = sig;
    const tree = cloneExcludeTree(loadedExcludeTree);
    setDraft((prev) => ({ ...prev, excludeTree: tree }));
    setApplied((prev) => ({ ...prev, excludeTree: cloneExcludeTree(loadedExcludeTree) }));
    setSelectedDivisionId(tree[0]?.id ?? "");
    setSelectedHeadId(tree[0]?.heads[0]?.id ?? "");
  }, [loadedExcludeTree]);

  const selectedDivision = useMemo(
    () =>
      draft.excludeTree.find((division) => division.id === selectedDivisionId) ??
      draft.excludeTree[0] ??
      null,
    [draft.excludeTree, selectedDivisionId],
  );

  const selectedHead = useMemo(
    () =>
      selectedDivision?.heads.find((head) => head.id === selectedHeadId) ??
      selectedDivision?.heads[0] ??
      null,
    [selectedDivision, selectedHeadId],
  );

  const excludeTagItems = useMemo(
    () => flattenCheckedTagItems(draft.excludeTree),
    [draft.excludeTree],
  );
  const appliedExcludeCount = useMemo(
    () => flattenCheckedTagItems(applied.excludeTree).length,
    [applied.excludeTree],
  );

  /** 부문 이름 클릭과 동일: 부문 선택 + 첫 본부 → 글자색·3열 팀 목록 갱신 */
  const navigateToDivision = (division: ExcludeDivisionNode) => {
    setSelectedDivisionId(division.id);
    setSelectedHeadId(division.heads[0]?.id ?? "");
  };

  const handleWeightChange = (key: WeightKey, value: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(value)));
    setDraft((prev) => ({ ...prev, weight: { ...prev.weight, [key]: clamped } }));
  };

  const handleApply = () => {
    setApplied(draft);
    const weightRow = weightStateToRecommendMembersWeight(draft.weight);
    onApplyRecommendConditions?.({
      weights: [weightRow],
      excludeOrgIds: extractExcludedOrgIds(draft.excludeTree),
      viewLimit: draft.viewCount as RecommendViewLimit,
    });
  };

  const handleRefresh = () => {
    void onRequestServerBaselineReset?.();
  };

  useEffect(() => {
    if (serverBaselineEpoch === 0) return;
    syncedMatchingWeightsSigRef.current = "";
    syncedOrgPayloadRef.current = "";
    syncedConstraintSigRef.current = "";
    setDraft((prev) => ({
      ...prev,
      viewCount: INITIAL_CONDITION_DRAFT.viewCount,
      prioritizeAvailable: INITIAL_CONDITION_DRAFT.prioritizeAvailable,
    }));
    setApplied((prev) => ({
      ...prev,
      viewCount: INITIAL_CONDITION_DRAFT.viewCount,
      prioritizeAvailable: INITIAL_CONDITION_DRAFT.prioritizeAvailable,
    }));
  }, [serverBaselineEpoch]);

  const innerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const measure = () => setContentHeight(Math.max(el.scrollHeight, 1));
    measure();

    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [detailsOpen]);

  const collapseShellStyle: CSSProperties =
    contentHeight === undefined
      ? detailsOpen
        ? {}
        : { maxHeight: 0 }
      : { maxHeight: detailsOpen ? contentHeight : 0 };

  return (
    <div className={styles.configCard}>
      <div className={styles.configInner}>
        <div className={styles.configTitleRow}>
          <div className={styles.configTitleLeft}>
            <div className={styles.slidersIcon}>
              <IconSliders />
              <span className={styles.configTitle}>AI 추천 조건 설정</span>
            </div>
            <span className={styles.configRoleTag}>배정 역할: {assignRole}</span>
          </div>
          <button
            type="button"
            className={styles.chevBtn}
            aria-expanded={detailsOpen}
            aria-controls="ai-recommend-condition-details"
            aria-label={detailsOpen ? "추천 조건 접기" : "추천 조건 펼치기"}
            onClick={onToggleDetails}
          >
            <span className={detailsOpen ? undefined : styles.chevBtnChevronFlipped} aria-hidden>
              <IconChevronUp />
            </span>
          </button>
        </div>

        <div className={styles.detailsCollapseShell} style={collapseShellStyle}>
          <div
            ref={innerRef}
            id="ai-recommend-condition-details"
            className={styles.contentWrap}
            aria-hidden={!detailsOpen}
          >
            <div className={styles.tabs}>
              {TAB_OPTIONS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`${styles.tabBtn} ${draft.activeTab === tab.id ? styles.tabBtnActive : ""}`}
                  onClick={() => setDraft((prev) => ({ ...prev, activeTab: tab.id }))}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {draft.activeTab === "weight" ? (
              <div className={styles.panelBox}>
                {([
                  ["orgPeople", "조직 내 인력"],
                  ["skillMatch", "스킬셋 매치"],
                  ["similarHistory", "유사 이력"],
                ] as Array<[WeightKey, string]>).map(([key, label]) => (
                  <div className={styles.sliderRow} key={key}>
                    <div className={styles.sliderHead}>
                      <span className={styles.sliderLabel}>{label}</span>
                      <strong className={styles.sliderValue}>
                        {draft.weight[key]}%
                      </strong>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={draft.weight[key]}
                      onChange={(event) => handleWeightChange(key, Number(event.target.value))}
                    />
                  </div> 
                ))}
              </div>
            ) : null}

            {draft.activeTab === "constraint" ? (
              <div className={styles.constraintBox}>
                <ul>
                  {draft.constraintLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {draft.activeTab === "exclude" ? (
              <div className={styles.excludeWrap}>
                <h4 className={styles.excludeTitle}>부문/본부/팀</h4>
                {loadedExcludeTree === undefined ? (
                  <p className={styles.orgLoading}>조직 정보를 불러오는 중…</p>
                ) : excludeOrgError ? (
                  <p className={styles.orgError} role="alert">
                    {excludeOrgError}
                  </p>
                ) : draft.excludeTree.length === 0 ? (
                  <p className={styles.orgEmpty}>조직 데이터가 없습니다.</p>
                ) : (
                  <div className={styles.excludeColumns}>
                    <div className={styles.excludeColumn}>
                      {draft.excludeTree.map((division) => (
                        <label key={division.id} className={styles.checkLine}>
                          <OrgTriCheckbox
                            state={getDivisionTriState(division)}
                            ariaLabel={`${division.label} 제외 ${getDivisionTriState(division) === "checked" ? "해제" : "선택"}`}
                            onChange={(checked) => {
                              navigateToDivision(division);
                              setDraft((prev) => ({
                                ...prev,
                                excludeTree: toggleDivision(prev.excludeTree, division.id, checked),
                              }));
                            }}
                          />
                          <button
                            type="button"
                            className={`${styles.treeBtn} ${selectedDivision?.id === division.id ? styles.treeBtnActive : ""}`}
                            onClick={() => navigateToDivision(division)}
                          >
                            {division.label}
                          </button>
                        </label>
                      ))}
                    </div>

                    <div className={styles.excludeColumn}>
                      {selectedDivision?.heads.map((head) => (
                        <label key={head.id} className={styles.checkLine}>
                          <OrgTriCheckbox
                            state={getHeadTriState(head)}
                            ariaLabel={`${head.label} 제외 ${getHeadTriState(head) === "checked" ? "해제" : "선택"}`}
                            onChange={(checked) => {
                              if (!selectedDivision) return;
                              setSelectedHeadId(head.id);
                              setDraft((prev) => ({
                                ...prev,
                                excludeTree: toggleHead(prev.excludeTree, selectedDivision.id, head.id, checked),
                              }));
                            }}
                          />
                          <button
                            type="button"
                            className={`${styles.treeBtn} ${selectedHead?.id === head.id ? styles.treeBtnActive : ""}`}
                            onClick={() => setSelectedHeadId(head.id)}
                          >
                            {head.label}
                          </button>
                        </label>
                      )) ?? null}
                    </div>

                    <div className={styles.excludeColumn}>
                      {selectedDivision && selectedHead
                        ? selectedHead.teams.map((team) => (
                            <label key={team.id} className={styles.checkLine}>
                              <OrgLeafCheckbox
                                checked={team.checked}
                                ariaLabel={`${team.label} 제외 ${team.checked ? "해제" : "선택"}`}
                                onChange={(checked) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    excludeTree: toggleTeam(
                                      prev.excludeTree,
                                      selectedDivision.id,
                                      selectedHead.id,
                                      team.id,
                                      checked,
                                    ),
                                  }))
                                }
                              />
                              <span>{team.label}</span>
                            </label>
                          ))
                        : null}
                    </div>
                  </div>
                )}
                <div className={styles.tagRow}>
                  {excludeTagItems.map((item) => (
                    <span key={item.tagKey} className={styles.tagPill}>
                      <span className={styles.tagPillLabel}>{item.label}</span>
                      <button
                        type="button"
                        className={styles.tagRemoveBtn}
                        aria-label={`${item.label} 제외 항목에서 제거`}
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            excludeTree: removeExcludeTagItem(prev.excludeTree, item),
                          }))
                        }
                      >
                        <IconTagRemove />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className={styles.bottomBar}>
              <div className={styles.summaryLine}>
                <span>
                  조직 내 인력 <strong>{applied.weight.orgPeople}%</strong>
                </span>
                <span>
                  스킬셋 매치 <strong>{applied.weight.skillMatch}%</strong>
                </span>
                <span>
                  유사 인력 <strong>{applied.weight.similarHistory}%</strong>
                </span>
              </div>
              <div className={styles.viewCountBox}>
                <span className={styles.bottomLabel}>보기 설정</span>
                <div className={styles.segment}>
                  {VIEW_COUNT_OPTIONS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      className={`${styles.segmentBtn} ${draft.viewCount === count ? styles.segmentBtnActive : ""}`}
                      onClick={() => setDraft((prev) => ({ ...prev, viewCount: count }))}
                    >
                      {count}명
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.metaItem}>직무역량 및 제약조건 적용</div>
              <div className={styles.metaItem}>제외 항목 {appliedExcludeCount}개</div>
              <label className={styles.availableFirst}>
                <input
                  type="checkbox"
                  checked={draft.prioritizeAvailable}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, prioritizeAvailable: event.target.checked }))
                  }
                />
                <span>가용 인력 우선</span>
              </label>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="저장된 설정으로 되돌리기"
                onClick={handleRefresh}
              >
                <IconRefresh />
              </button>
              <button type="button" className={styles.applyBtn} onClick={handleApply}>
                설정 적용
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
