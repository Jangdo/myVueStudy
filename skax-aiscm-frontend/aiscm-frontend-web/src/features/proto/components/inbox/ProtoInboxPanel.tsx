"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { protoCommandService } from "@/features/proto/services/protoCommandService";
import { protoQueryService } from "@/features/proto/services/protoQueryService";
import { PROTO_DASHBOARD_REFRESH_EVENT } from "@/features/proto/config";
import type { ProtoApprovalItem } from "@/features/proto/types";
import styles from "./ProtoInboxPanel.module.css";

function formatApprovalDateTime(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function InboxApprovalCard({
  row: r,
  busyId,
  onResolve,
}: {
  row: ProtoApprovalItem;
  busyId: number | null;
  onResolve: (id: number, action: "approve" | "reject") => void;
}) {
  const id = r.id;
  const projectName =
    typeof r.projectName === "string"
      ? r.projectName
      : r.projectId != null
        ? `프로젝트 #${r.projectId}`
        : "-";
  const projectMeta = typeof r.projectClient === "string" ? r.projectClient.trim() : "";
  const approvalType = String(r.approvalType ?? "");
  const projectRoleName = typeof r.roleName === "string" ? r.roleName.trim() : "";
  const assignmentTypeStr = typeof r.assignmentType === "string" ? r.assignmentType : "";
  const headerJobLabel =
    projectRoleName !== ""
      ? projectRoleName
      : approvalType === "pm_assign"
        ? "PM"
        : approvalType === "team_assign"
          ? "인력 투입"
          : assignmentTypeStr.toLowerCase() === "pm"
            ? "PM"
            : "";
  const targetName =
    typeof r.employeeName === "string"
      ? r.employeeName
      : r.employeeId != null
        ? `직원 #${r.employeeId}`
        : "-";
  const employeeJob = typeof r.employeeRole === "string" ? r.employeeRole.trim() : "";
  const subtitleRole = employeeJob !== "" && employeeJob !== headerJobLabel ? employeeJob : "";
  const matchScore = r.matchScore != null ? Number(r.matchScore) : null;
  const requesterName = typeof r.requester === "string" ? r.requester : "-";
  const approvalTimeLabel = formatApprovalDateTime(r.createdAt);
  const approverRole = typeof r.approverRole === "string" ? r.approverRole : "-";
  const riskLevel = typeof r.riskLevel === "string" ? r.riskLevel : "";
  const riskReason = typeof r.riskReason === "string" ? r.riskReason : "";
  const cl = typeof r.employeeCl === "string" ? r.employeeCl : "CL3";
  const team = typeof r.employeeTeam === "string" ? r.employeeTeam : "";
  const avatar = targetName && targetName !== "-" ? targetName.charAt(0) : "?";
  const approveLabel =
    approvalType === "pm_assign"
      ? approverRole === "BL"
        ? "✓ 사업부장 검토 완료 (1/2)"
        : "✓ 최종 승인 (2/2)"
      : "✓ 승인";
  const rejectLabel = approvalType === "pm_assign" ? "✕ 반려 (Reject)" : "✕ 반려";

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.pjt}>
          <div className={styles.pjtTitleRow}>
            <span className={styles.pjtName}>{projectName}</span>
            {headerJobLabel ? <span className={styles.pjtJob}>{headerJobLabel}</span> : null}
            {riskLevel ? <span className={styles.riskBadge}>{riskLevel}</span> : null}
            {riskReason ? <span className={styles.riskInline}>{riskReason}</span> : null}
          </div>
          {projectMeta ? <div className={styles.pjtMeta}>{projectMeta}</div> : null}
        </div>
        <div className={styles.headerRight}>
          <span className={styles.meta}>승인요청자: {requesterName}</span>
          {approvalTimeLabel ? <span className={styles.meta}>승인일시: {approvalTimeLabel}</span> : null}
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.person}>
          <div className={styles.avatar}>{avatar}</div>
          <div>
            <div className={styles.candName}>
              {targetName} <span className={styles.cl}>{cl}</span>
              {team ? <span className={styles.cl}>{team}</span> : null}
            </div>
            {subtitleRole ? <div className={styles.candRole}>{subtitleRole}</div> : null}
          </div>
        </div>
        <div className={styles.scoreCol}>
          <div className={styles.scoreLabel}>스킬 적합도</div>
          <div className={styles.scoreVal}>
            {matchScore != null && Number.isFinite(matchScore) ? `${Math.round(matchScore)} 점` : "-"}
          </div>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnApprove}
            disabled={busyId === id}
            onClick={() => onResolve(id, "approve")}
          >
            {approveLabel}
          </button>
          <button
            type="button"
            className={styles.btnReject}
            disabled={busyId === id}
            onClick={() => onResolve(id, "reject")}
          >
            {rejectLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ProtoInboxPanel() {
  const [role, setRole] = useState("BL");
  const [items, setItems] = useState<ProtoApprovalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(
    async (silent: boolean) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError("");
        const list = await protoQueryService.getApprovals(role === "BL" || role === "SL" ? role : undefined);
        setItems(Array.isArray(list) ? list : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "승인 목록 조회 실패");
        setItems([]);
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [role],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const resolve = async (id: number, action: "approve" | "reject"): Promise<void> => {
    try {
      setResolvingId(id);
      setError("");
      // prototype InboxPanel: comment 고정 빈 문자열
      await protoCommandService.updateApproval(id, {
        action,
        comment: "",
        approverName: role,
      });
      await load(true);
      window.dispatchEvent(new Event(PROTO_DASHBOARD_REFRESH_EVENT));
    } catch (e) {
      setError(e instanceof Error ? e.message : "승인 처리 실패");
    } finally {
      setResolvingId(null);
    }
  };

  const { pmRows, staffRows } = useMemo(() => {
    const pm: ProtoApprovalItem[] = [];
    const staff: ProtoApprovalItem[] = [];
    for (const r of items) {
      if (String(r.approvalType) === "pm_assign") pm.push(r);
      else staff.push(r);
    }
    return { pmRows: pm, staffRows: staff };
  }, [items]);

  const pendingCount = items.length;

  return (
    <section className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.countBadge} aria-live="polite">
          {pendingCount}건 대기
        </span>
        <label>
          역할(데모){" "}
          <select value={role} onChange={(e) => setRole(e.target.value)} disabled={loading}>
            <option value="BL">BL</option>
            <option value="SL">SL</option>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </label>
        <button type="button" onClick={() => void load(false)} disabled={loading}>
          다시 조회
        </button>
      </div>

      {loading ? <span className={styles.hint}>불러오는 중…</span> : null}
      {refreshing ? <span className={styles.hint}>목록 새로고침 중…</span> : null}
      {error ? <p className={styles.err}>{error}</p> : null}

      {items.length === 0 && !loading ? (
        <div className={styles.empty}>승인 대기 건이 없습니다.</div>
      ) : null}

      {items.length > 0 ? (
        <>
          {pmRows.length > 0 ? (
            <>
              <div className={styles.sectionLabel}>PM 배정 승인 요청</div>
              <div className={styles.list}>
                {pmRows.map((r) => (
                  <InboxApprovalCard key={r.id} row={r} busyId={resolvingId} onResolve={resolve} />
                ))}
              </div>
            </>
          ) : null}
          {staffRows.length > 0 ? (
            <>
              <div
                className={
                  pmRows.length > 0 ? `${styles.sectionLabel} ${styles.sectionLabelAfterPm}` : styles.sectionLabel
                }
              >
                인력 투입 승인 요청
              </div>
              <div className={styles.list}>
                {staffRows.map((r) => (
                  <InboxApprovalCard key={r.id} row={r} busyId={resolvingId} onResolve={resolve} />
                ))}
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
