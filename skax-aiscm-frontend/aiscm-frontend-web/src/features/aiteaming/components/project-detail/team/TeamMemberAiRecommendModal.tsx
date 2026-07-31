"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AppMessageDialog } from "@/shared/ui/AppDialog";
import { mapRecommendMembersBlockToRows } from "@/features/aiteaming/lib/recommendMembersToUiRows";
import { aiteamingAssignmentService } from "@/features/aiteaming/services/aiteamingAssignmentService";
import { aiteamingMatchingService } from "@/features/aiteaming/services/aiteamingMatchingService";
import { aiteamingOrgsService } from "@/features/aiteaming/services/aiteamingOrgsService";
import {
  AITEAMING_MP_SELCT_TP_AI_TEAMING,
  buildAssignmentRegisterRequest,
} from "@/features/aiteaming/types/assignments";
import {
  buildRecommendMembersRequest,
  mapMatchingWeightsToRecommendWeights,
  type MatchingExcludedOrgRes,
  type RecommendMembersWeight,
  type RecommendViewLimit,
} from "@/features/aiteaming/types/matchingMembers";
import type { AiteamingOrgTreeNode } from "@/features/aiteaming/types/orgs";
import {
  jobCmptCntnToConstraintLines,
  type AiTeamingStaffingMember,
} from "@/features/aiteaming/components/project-detail/team/teamMembersFromApi";
import { mapAiteamingOrgsToExcludeTree } from "./ai-recommend-modal/condition/orgTreeMap";
import { applyExcludedOrgIdsToTree, extractExcludedOrgIds } from "./ai-recommend-modal/condition/utils";
import { AiRecommendConditionSection } from "./ai-recommend-modal/AiRecommendConditionSection";
import { AiRecommendFooter } from "./ai-recommend-modal/AiRecommendFooter";
import { AiRecommendModalHeader } from "./ai-recommend-modal/AiRecommendModalHeader";
import { AiRecommendResultSection } from "./ai-recommend-modal/AiRecommendResultSection";
import type { RecommendRow } from "./ai-recommend-modal/types";
import styles from "./TeamMemberAiRecommendModal.module.css";

export interface TeamMemberAiRecommendModalProps {
  open: boolean;
  onClose: () => void;
  /** 상세 페이지 `projectCode` (= API `pjtNo`) */
  projectCode: string;
  /** 배정 역할 표시 (예: 디자인 PL) */
  assignRole: string;
  /** 행의 `pjtRoleDmndId` — 투입인력 API에서 내려온 값 */
  pjtRoleDmndId: string;
  /** 배정 API·행 갱신에 쓰는 원본 테이블 행 스냅샷 */
  sourceRow: AiTeamingStaffingMember | null;
  /** 배정 성공 시 — 서버와 동기화용으로 `Promise` 반환 가능 (예: 투입인력 재조회 후 모달 닫기) */
  onAssigned?: (selected: RecommendRow, source: AiTeamingStaffingMember) => void | Promise<void>;
}

export function TeamMemberAiRecommendModal({
  open,
  onClose,
  projectCode,
  assignRole,
  pjtRoleDmndId,
  sourceRow,
  onAssigned,
}: TeamMemberAiRecommendModalProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rows, setRows] = useState<RecommendRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [orgRootsRaw, setOrgRootsRaw] = useState<AiteamingOrgTreeNode[] | undefined>(undefined);
  const [serverExcludedOrgRows, setServerExcludedOrgRows] = useState<MatchingExcludedOrgRes[] | undefined>(
    undefined,
  );
  const [orgsFetchError, setOrgsFetchError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [matchingWeightsForUi, setMatchingWeightsForUi] = useState<RecommendMembersWeight[] | undefined>(
    undefined,
  );
  const [recommendApplyTick, setRecommendApplyTick] = useState(0);
  const lastRecommendApplyRef = useRef<{
    weights: RecommendMembersWeight[];
    excludeOrgIds: string[];
    viewLimit: RecommendViewLimit;
  } | null>(null);
  const matchingWeightsRef = useRef<RecommendMembersWeight[] | undefined>(undefined);
  const [messageDialog, setMessageDialog] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "안내",
    message: "",
  });
  /** 조건 영역: DB 저장 가중치·제외 조직으로 재동기화 트리거 */
  const [conditionBaselineEpoch, setConditionBaselineEpoch] = useState(0);

  const roleDemandId = (pjtRoleDmndId ?? "").trim();

  const loadedExcludeTree = useMemo(() => {
    if (orgRootsRaw === undefined || serverExcludedOrgRows === undefined) {
      return undefined;
    }
    const base = mapAiteamingOrgsToExcludeTree(orgRootsRaw);
    const ids = serverExcludedOrgRows.map((r) => (r.orgId ?? "").trim()).filter(Boolean);
    return applyExcludedOrgIdsToTree(base, ids);
  }, [orgRootsRaw, serverExcludedOrgRows]);

  const roleConstraintLines = useMemo(
    () => (sourceRow ? jobCmptCntnToConstraintLines(sourceRow.jobCmptCntn) : undefined),
    [sourceRow],
  );

  useEffect(() => {
    matchingWeightsRef.current = matchingWeightsForUi;
  }, [matchingWeightsForUi]);

  useEffect(() => {
    if (!open) {
      setRecommendApplyTick(0);
      lastRecommendApplyRef.current = null;
      setMatchingWeightsForUi(undefined);
      matchingWeightsRef.current = undefined;
      setConditionBaselineEpoch(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setOrgRootsRaw(undefined);
      setOrgsFetchError(null);
      return;
    }
    setOrgRootsRaw(undefined);
    setOrgsFetchError(null);
    let cancelled = false;
    void (async () => {
      try {
        const data = await aiteamingOrgsService.getOrgTree();
        if (!cancelled) {
          setOrgRootsRaw(data ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setOrgsFetchError(e instanceof Error ? e.message : "조직 정보를 불러오지 못했습니다.");
          setOrgRootsRaw([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !roleDemandId) {
      setServerExcludedOrgRows(undefined);
      return;
    }
    let cancelled = false;
    setServerExcludedOrgRows(undefined);
    void (async () => {
      try {
        const rows = await aiteamingMatchingService.getExcludedOrgs(roleDemandId);
        if (!cancelled) {
          setServerExcludedOrgRows(rows ?? []);
        }
      } catch {
        if (!cancelled) {
          setServerExcludedOrgRows([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, roleDemandId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setSelectedId(null);
      setDetailsOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setAssigning(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !projectCode.trim()) {
      return;
    }
    if (!roleDemandId) {
      setLoading(false);
      setFetchError("역할 수요 ID(pjtRoleDmndId)가 없습니다.");
      setRows([]);
      return;
    }
    if (loadedExcludeTree === undefined) {
      setLoading(true);
      setFetchError(null);
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    setRows([]);
    setMatchingWeightsForUi(undefined);

    const run = async () => {
      try {
        const weightRows = await aiteamingMatchingService.getSavedWeights(roleDemandId);
        const weights = mapMatchingWeightsToRecommendWeights(weightRows);
        if (!cancelled) {
          setMatchingWeightsForUi(weights);
        }
        matchingWeightsRef.current = weights;
        const orgExclsPayload = extractExcludedOrgIds(loadedExcludeTree).map((orgId) => ({ orgId }));
        const body = buildRecommendMembersRequest(roleDemandId, {
          weights: weights.length > 0 ? weights : undefined,
          orgExcls: orgExclsPayload.length > 0 ? orgExclsPayload : undefined,
          /* 모달 최초 로드: 보기 설정 기본 15명. DB 저장 추후 — API만 전달 */
          viewLimit: 15,
        });
        const blocks = await aiteamingMatchingService.postRecommendMembers(projectCode.trim(), body);
        if (cancelled) return;
        const block = blocks?.[0];
        if (block == null) {
          setRows([]);
          return;
        }
        const candidates = block.candidates ?? [];
        if (candidates.length === 0) {
          setRows([]);
          return;
        }
        setRows(mapRecommendMembersBlockToRows(block, assignRole));
      } catch (e) {
        if (!cancelled) {
          setFetchError(e instanceof Error ? e.message : "AI 추천을 불러오지 못했습니다.");
          setRows([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [open, projectCode, assignRole, roleDemandId, loadedExcludeTree]);

  useEffect(() => {
    if (recommendApplyTick === 0) {
      return;
    }
    if (!open || !projectCode.trim() || !roleDemandId) {
      return;
    }
    const payload = lastRecommendApplyRef.current;
    if (payload == null) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    const run = async () => {
      try {
        const orgPayload = payload.excludeOrgIds.map((orgId) => ({ orgId }));
        const body = buildRecommendMembersRequest(roleDemandId, {
          weights: payload.weights.length > 0 ? payload.weights : undefined,
          orgExcls: orgPayload.length > 0 ? orgPayload : undefined,
          viewLimit: payload.viewLimit,
        });
        const blocks = await aiteamingMatchingService.postRecommendMembers(projectCode.trim(), body);
        if (cancelled) return;
        const block = blocks?.[0];
        if (block == null) {
          setRows([]);
          return;
        }
        const candidates = block.candidates ?? [];
        if (candidates.length === 0) {
          setRows([]);
          return;
        }
        setRows(mapRecommendMembersBlockToRows(block, assignRole));
        if (!cancelled) {
          setMatchingWeightsForUi(payload.weights);
          matchingWeightsRef.current = payload.weights;
        }
      } catch (e) {
        if (!cancelled) {
          setFetchError(e instanceof Error ? e.message : "AI 추천을 불러오지 못했습니다.");
          setRows([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [recommendApplyTick, open, projectCode, assignRole, roleDemandId]);

  const handleServerBaselineReset = async () => {
    if (!roleDemandId) return;
    try {
      const [weightRows, exclRows] = await Promise.all([
        aiteamingMatchingService.getSavedWeights(roleDemandId),
        aiteamingMatchingService.getExcludedOrgs(roleDemandId),
      ]);
      setMatchingWeightsForUi(mapMatchingWeightsToRecommendWeights(weightRows));
      setServerExcludedOrgRows(exclRows ?? []);
      setConditionBaselineEpoch((n) => n + 1);
    } catch {
      /* 조용히 무시 — 필요 시 안내 다이얼로그 확장 가능 */
    }
  };

  const handleAssign = () => {
    if (!selectedId || !sourceRow) {
      return;
    }
    const selected = rows.find((r) => r.id === selectedId);
    if (!selected) {
      setMessageDialog({ open: true, title: "안내", message: "선택한 추천 행을 찾을 수 없습니다." });
      return;
    }
    const empNo = (selected.person.empId ?? "").trim();
    if (!empNo || empNo.startsWith("candidate-")) {
      setMessageDialog({
        open: true,
        title: "안내",
        message: "유효한 사원번호(empNo)가 없어 역할 배정을 요청할 수 없습니다.",
      });
      return;
    }
    let body;
    try {
      body = buildAssignmentRegisterRequest(roleDemandId, empNo, { tmpSeq: selected.tmgSeq });
    } catch (e) {
      setMessageDialog({
        open: true,
        title: "안내",
        message: e instanceof Error ? e.message : "배정 요청 본문을 만들 수 없습니다.",
      });
      return;
    }

    setAssigning(true);
    void (async () => {
      try {
        await aiteamingAssignmentService.postRegister(AITEAMING_MP_SELCT_TP_AI_TEAMING, body);
        try {
          await onAssigned?.(selected, sourceRow);
        } catch (refreshErr) {
          console.error(refreshErr);
          setMessageDialog({
            open: true,
            title: "안내",
            message:
              refreshErr instanceof Error
                ? `배정은 완료되었으나 목록 갱신에 실패했습니다: ${refreshErr.message}`
                : "배정은 완료되었으나 목록 갱신에 실패했습니다. 페이지를 새로고침해 주세요.",
          });
        }
        onClose();
      } catch (e) {
        setMessageDialog({
          open: true,
          title: "오류",
          message: e instanceof Error ? e.message : "역할 배정이 정상 처리되지 않았습니다. 다시 시도해 주세요.",
        });
      } finally {
        setAssigning(false);
      }
    })();
  };

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <>
      <div className={styles.backdrop} role="presentation" onClick={onClose}>
        <div
          className={styles.panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(event) => event.stopPropagation()}
        >
          <AiRecommendModalHeader titleId={titleId} onClose={onClose} />
          <div className={styles.body}>
            <AiRecommendConditionSection
              assignRole={assignRole}
              detailsOpen={detailsOpen}
              onToggleDetails={() => setDetailsOpen((prev) => !prev)}
              loadedExcludeTree={loadedExcludeTree}
              excludeOrgError={orgsFetchError}
              roleConstraintLines={roleConstraintLines}
              matchingWeights={matchingWeightsForUi}
              serverBaselineEpoch={conditionBaselineEpoch}
              onRequestServerBaselineReset={handleServerBaselineReset}
              onApplyRecommendConditions={(payload) => {
                lastRecommendApplyRef.current = payload;
                setRecommendApplyTick((t) => t + 1);
              }}
            />
            {fetchError ? (
              <p className={styles.fetchError} role="alert">
                {fetchError}
              </p>
            ) : null}
            <div className={styles.resultShell}>
              <AiRecommendResultSection
                loading={Boolean(loading && !fetchError)}
                totalShown={rows.length}
                rows={rows}
                selectedId={selectedId}
                onSelectRow={setSelectedId}
              />
            </div>
          </div>
          <AiRecommendFooter
            disabled={
              selectedId == null || loading || assigning || sourceRow == null || Boolean(fetchError)
            }
            onAssign={handleAssign}
          />
        </div>
      </div>
      <AppMessageDialog
        open={messageDialog.open}
        title={messageDialog.title}
        message={messageDialog.message}
        onClose={() => setMessageDialog((prev) => ({ ...prev, open: false }))}
      />
    </>,
    document.body,
  );
}
