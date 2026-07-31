"use client";

import { useEffect, useState } from "react";
import { protoCommandService } from "@/features/proto/services/protoCommandService";
import { protoQueryService } from "@/features/proto/services/protoQueryService";
import type { ProtoProjectDetailData, ProtoProjectItem } from "@/features/proto/types";
import shared from "../shared/protoPanelShared.module.css";

export default function ProtoProjectsPanel() {
  const [user, setUser] = useState("am");
  const [items, setItems] = useState<ProtoProjectItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProtoProjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [roleName, setRoleName] = useState("Proto 샘플 롤");
  const [employeeIdStr, setEmployeeIdStr] = useState("1");
  const [roleIdStr, setRoleIdStr] = useState("");
  const [createApproval, setCreateApproval] = useState(true);
  const [writeBusy, setWriteBusy] = useState(false);
  const [writeInfo, setWriteInfo] = useState("");
  const [approvalIdStr, setApprovalIdStr] = useState("");
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await protoQueryService.getProjects(user);
        if (active) {
          setItems(response);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "프로젝트 조회 실패";
        if (active) {
          setError(message);
          setItems([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [user]);

  const handleLoadDetail = async (id: number): Promise<void> => {
    try {
      setError("");
      const detail = await protoQueryService.getProjectDetail(id);
      setSelectedProject(detail);
      setWriteInfo("");
    } catch (e) {
      const message = e instanceof Error ? e.message : "프로젝트 상세 조회 실패";
      setError(message);
    }
  };

  const refreshDetail = async (): Promise<void> => {
    if (selectedProject == null) {
      return;
    }
    const detail = await protoQueryService.getProjectDetail(selectedProject.id);
    setSelectedProject(detail);
  };

  const handleCreateRole = async (): Promise<void> => {
    if (selectedProject == null) {
      return;
    }
    try {
      setWriteBusy(true);
      setError("");
      setWriteInfo("");
      const res = await protoCommandService.createProjectRole(selectedProject.id, {
        roleName: roleName.trim() || "Proto 샘플 롤",
        quantity: 1,
        filled: 0,
      });
      setWriteInfo(`롤 생성 완료: id=${res.id}`);
      await refreshDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : "롤 생성 실패");
    } finally {
      setWriteBusy(false);
    }
  };

  const handleCreateAssignment = async (): Promise<void> => {
    if (selectedProject == null) {
      return;
    }
    const employeeId = Number.parseInt(employeeIdStr, 10);
    if (Number.isNaN(employeeId)) {
      setError("employeeId는 숫자여야 합니다.");
      return;
    }
    let roleId: number | undefined;
    if (roleIdStr.trim() !== "") {
      const parsed = Number.parseInt(roleIdStr, 10);
      if (Number.isNaN(parsed)) {
        setError("roleId는 숫자여야 합니다.");
        return;
      }
      roleId = parsed;
    } else if (selectedProject.roles && selectedProject.roles.length > 0) {
      roleId = selectedProject.roles[0].id;
    }
    try {
      setWriteBusy(true);
      setError("");
      setWriteInfo("");
      const res = await protoCommandService.createAssignment({
        projectId: selectedProject.id,
        employeeId,
        roleId,
        assignmentType: "proto_sample",
        createApproval,
        approvalType: "assignment",
        requester: "proto-ui",
      });
      const approvalHint = res.approvalId != null ? ` approvalId=${res.approvalId}(승인 결정에 사용)` : "";
      setWriteInfo(`배정 생성: assignmentId=${res.assignmentId}${approvalHint}`);
      if (res.approvalId != null) {
        setApprovalIdStr(String(res.approvalId));
      }
      await refreshDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : "배정 생성 실패");
    } finally {
      setWriteBusy(false);
    }
  };

  const handleDecideApproval = async (): Promise<void> => {
    const id = Number.parseInt(approvalIdStr, 10);
    if (Number.isNaN(id)) {
      setError("승인 ID는 숫자여야 합니다.");
      return;
    }
    try {
      setWriteBusy(true);
      setError("");
      setWriteInfo("");
      const res = await protoCommandService.decideApproval(id, { decision });
      setWriteInfo(`승인 처리: id=${res.id}, status=${res.status}`);
      await refreshDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : "승인 처리 실패");
    } finally {
      setWriteBusy(false);
    }
  };

  if (loading) {
    return <p className={shared.hint}>프로젝트 조회 중…</p>;
  }
  if (error) {
    return <p className={shared.err}>오류: {error}</p>;
  }
  if (items.length === 0) {
    return <p className={shared.muted}>조회된 프로젝트가 없습니다.</p>;
  }

  return (
    <section className={shared.page}>
      <label className={shared.userLabel}>
        user
        <select className={shared.control} value={user} onChange={(event) => setUser(event.target.value)}>
          <option value="am">am</option>
          <option value="pm">pm</option>
          <option value="bl">bl</option>
          <option value="sl">sl</option>
        </select>
      </label>
      <ul className={`${shared.list} ${shared.listTight}`}>
        {items.map((item) => (
          <li key={item.id}>
            #{item.id} {item.name} ({item.stage}){" "}
            <button type="button" className={shared.btn} onClick={() => void handleLoadDetail(item.id)}>
              상세
            </button>
          </li>
        ))}
      </ul>
      {selectedProject ? (
        <div className={`${shared.card} ${shared.cardMuted}`}>
          <strong className={shared.detailTitle}>프로젝트 상세</strong>
          <p className={shared.detailP}>
            id={selectedProject.id}, name={selectedProject.name}, stage={selectedProject.stage}
          </p>
          <p className={shared.detailP}>
            owner={selectedProject.owner}, priority={selectedProject.priority}, budget={selectedProject.budget.toLocaleString()}
          </p>
          <p className={shared.detailP}>
            roles={selectedProject.roles?.length ?? 0}, assignments={selectedProject.assignments?.length ?? 0}
          </p>
          {selectedProject.roles && selectedProject.roles.length > 0 ? (
            <ul className={shared.listFlush}>
              {selectedProject.roles.map((role) => (
                <li key={role.id}>
                  id={role.id}, role={role.roleName}, qty={role.quantity}, filled={role.filled}
                </li>
              ))}
            </ul>
          ) : null}

          <fieldset className={shared.fieldset}>
            <legend className={shared.legend}>쓰기 샘플 (MIG 단계 4·공유 DB 주의)</legend>
            <p className={shared.fieldsetHelp}>롤 추가 → 배정(미입력 시 첫 롤 id 사용) → 승인 결정 순으로 시험할 수 있습니다.</p>
            <div className={shared.stack8}>
              <label className={shared.labelRow}>
                롤 이름
                <input
                  className={`${shared.control} ${shared.minW180}`}
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  disabled={writeBusy}
                />
                <button type="button" className={shared.btn} disabled={writeBusy} onClick={() => void handleCreateRole()}>
                  롤 생성
                </button>
              </label>
              <div className={shared.labelRow}>
                <span>배정 employeeId</span>
                <input
                  className={`${shared.control} ${shared.w72}`}
                  type="text"
                  value={employeeIdStr}
                  onChange={(e) => setEmployeeIdStr(e.target.value)}
                  disabled={writeBusy}
                  aria-label="배정 employeeId"
                />
                <span>roleId(선택)</span>
                <input
                  className={`${shared.control} ${shared.w88}`}
                  type="text"
                  value={roleIdStr}
                  onChange={(e) => setRoleIdStr(e.target.value)}
                  placeholder="비우면 첫 롤"
                  disabled={writeBusy}
                  aria-label="배정 roleId"
                />
                <label className={shared.labelInline}>
                  <input type="checkbox" checked={createApproval} onChange={(e) => setCreateApproval(e.target.checked)} disabled={writeBusy} />
                  승인 함께 생성
                </label>
                <button type="button" className={shared.btn} disabled={writeBusy} onClick={() => void handleCreateAssignment()}>
                  배정 생성
                </button>
              </div>
              <label className={shared.labelRow}>
                승인 ID
                <input className={`${shared.control} ${shared.w96}`} type="text" value={approvalIdStr} onChange={(e) => setApprovalIdStr(e.target.value)} disabled={writeBusy} />
                <select className={shared.control} value={decision} onChange={(e) => setDecision(e.target.value as "approved" | "rejected")} disabled={writeBusy}>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                </select>
                <button type="button" className={shared.btn} disabled={writeBusy} onClick={() => void handleDecideApproval()}>
                  승인 결정
                </button>
              </label>
            </div>
            {writeInfo ? <p className={shared.success}>{writeInfo}</p> : null}
          </fieldset>
        </div>
      ) : null}
    </section>
  );
}
