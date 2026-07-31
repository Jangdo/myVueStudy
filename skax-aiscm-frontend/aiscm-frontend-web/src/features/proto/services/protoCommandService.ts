import { http } from "@/shared/http/client";
import { unwrapApiResponse } from "@/shared/http/unwrapApiResponse";
import { protoConfig } from "@/features/proto/config";
import type { ApiResponse } from "@/shared/types/api";

export interface ProtoMarkReadResult {
  id: number;
  isRead: boolean;
}

export interface ProtoMatchingLogCreateBody {
  projectId: number;
  roleId?: number;
  matchingType: string;
  weights?: string;
  results?: string;
  createdBy?: string;
}

export interface ProtoMatchingLogCreateResult {
  id: number;
  projectId: number;
}

export interface ProtoApprovalDecideBody {
  decision: "approved" | "rejected";
  comment?: string;
}

export interface ProtoAssignmentCreateBody {
  projectId: number;
  employeeId: number;
  roleId?: number;
  assignmentType?: string;
  matchScore?: number;
  status?: string;
  createApproval?: boolean;
  approvalType?: string;
  requester?: string;
  approverRole?: string;
  approverName?: string;
}

export interface ProtoProjectRoleCreateBody {
  roleName: string;
  level?: string;
  requiredMm?: number;
  requiredSkills?: string;
  quantity?: number;
  filled?: number;
  monthlyCost?: number;
}

export interface ProtoProjectRoleCreateResult {
  id: number;
  projectId: number;
}

/** PUT /projects/{id}/scope — 백엔드 ProtoProjectScopeUpdateRequest 와 동일 필드(선택) */
export interface ProtoProjectScopeUpdateBody {
  name?: string | null;
  description?: string | null;
  industry?: string | null;
  priority?: string | null;
  techStack?: unknown;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number | null;
  pmId?: number | null;
}

/** PUT /projects/{projectId}/roles/{roleId} — 백엔드 ProtoProjectRoleUpdateRequest 와 동일 필드(선택) */
export interface ProtoProjectRoleUpdateBody {
  roleName?: string | null;
  level?: string | null;
  requiredMm?: number | null;
  requiredSkills?: unknown;
  quantity?: number | null;
  monthlyCost?: number | null;
}

export interface ProtoAssignmentCreateResult {
  assignmentId: number;
  approvalId?: number;
}

export const protoCommandService = {
  async markNotificationRead(id: number): Promise<ProtoMarkReadResult> {
    const { data } = await http.patch<ApiResponse<ProtoMarkReadResult>>(
      `${protoConfig.apiPrefix}/notifications/${id}/read`,
    );
    return unwrapApiResponse(data, "알림 읽음 처리에 실패했습니다.");
  },

  async markNotificationReadPut(id: number): Promise<{ id: number; isRead: boolean }> {
    const { data } = await http.put<ApiResponse<{ id: number; is_read: boolean }>>(
      `${protoConfig.apiPrefix}/notifications/${id}/read`,
    );
    const result = unwrapApiResponse(data, "알림 읽음 처리에 실패했습니다.");
    return {
      id: result.id,
      isRead: Boolean(result.is_read),
    };
  },

  async createMatchingLog(body: ProtoMatchingLogCreateBody): Promise<ProtoMatchingLogCreateResult> {
    const requestBody = {
      project_id: body.projectId,
      role_id: body.roleId,
      matching_type: body.matchingType,
      weights: body.weights,
      results: body.results,
      created_by: body.createdBy,
      ...body,
    };
    const { data } = await http.post<ApiResponse<ProtoMatchingLogCreateResult>>(
      `${protoConfig.apiPrefix}/matching/logs`,
      requestBody,
    );
    const result = unwrapApiResponse(data, "매칭 로그 저장에 실패했습니다.") as {
      id: number;
      projectId?: number;
      project_id?: number;
    };
    return {
      id: result.id,
      projectId: result.projectId ?? result.project_id ?? body.projectId,
    };
  },

  async decideApproval(id: number, body: ProtoApprovalDecideBody): Promise<{ id: number; status: string }> {
    const { data } = await http.post<ApiResponse<{ id: number; status: string }>>(
      `${protoConfig.apiPrefix}/approvals/${id}/decide`,
      body,
    );
    return unwrapApiResponse(data, "승인 처리에 실패했습니다.");
  },

  async createAssignment(body: ProtoAssignmentCreateBody): Promise<ProtoAssignmentCreateResult> {
    const requestBody = {
      project_id: body.projectId,
      employee_id: body.employeeId,
      role_id: body.roleId,
      type: body.assignmentType,
      match_score: body.matchScore,
      status: body.status,
      create_approval: body.createApproval,
      approval_type: body.approvalType,
      requester: body.requester,
      approver_role: body.approverRole,
      approver_name: body.approverName,
      // camelCase도 함께 유지해 기존 proto 호출부와 하위 호환
      ...body,
    };
    const { data } = await http.post<ApiResponse<ProtoAssignmentCreateResult>>(
      `${protoConfig.apiPrefix}/assignments`,
      requestBody,
    );
    const result = unwrapApiResponse(data, "배정 생성에 실패했습니다.") as {
      assignmentId?: number;
      assignment_id?: number;
      approvalId?: number;
      approval_id?: number;
    };
    return {
      assignmentId: result.assignmentId ?? result.assignment_id ?? 0,
      approvalId: result.approvalId ?? result.approval_id,
    };
  },

  async createProjectRole(projectId: number, body: ProtoProjectRoleCreateBody): Promise<ProtoProjectRoleCreateResult> {
    const requestBody = {
      role_name: body.roleName,
      level: body.level,
      required_mm: body.requiredMm,
      required_skills: body.requiredSkills,
      quantity: body.quantity,
      filled: body.filled,
      monthly_cost: body.monthlyCost,
      ...body,
    };
    const { data } = await http.post<ApiResponse<ProtoProjectRoleCreateResult>>(
      `${protoConfig.apiPrefix}/projects/${projectId}/roles`,
      requestBody,
    );
    const result = unwrapApiResponse(data, "프로젝트 롤 생성에 실패했습니다.") as {
      id: number;
      projectId?: number;
      project_id?: number;
    };
    return {
      id: result.id,
      projectId: result.projectId ?? result.project_id ?? projectId,
    };
  },

  async updateProjectScope(
    projectId: number,
    body: ProtoProjectScopeUpdateBody,
  ): Promise<{ id: number; updated: boolean }> {
    const requestBody = {
      name: body.name,
      description: body.description,
      industry: body.industry,
      priority: body.priority,
      tech_stack: body.techStack,
      start_date: body.startDate,
      end_date: body.endDate,
      budget: body.budget,
      pm_id: body.pmId,
    };
    const { data } = await http.put<ApiResponse<{ id: number; updated: boolean }>>(
      `${protoConfig.apiPrefix}/projects/${projectId}/scope`,
      requestBody,
    );
    return unwrapApiResponse(data, "프로젝트 스코프 저장에 실패했습니다.");
  },

  async updateProjectRole(
    projectId: number,
    roleId: number,
    body: ProtoProjectRoleUpdateBody,
  ): Promise<{ id: number; projectId: number; updated: boolean }> {
    const requestBody = {
      role_name: body.roleName,
      level: body.level,
      required_mm: body.requiredMm,
      required_skills: body.requiredSkills,
      quantity: body.quantity,
      monthly_cost: body.monthlyCost,
    };
    const { data } = await http.put<ApiResponse<{ id: number; project_id: number; updated: boolean }>>(
      `${protoConfig.apiPrefix}/projects/${projectId}/roles/${roleId}`,
      requestBody,
    );
    const result = unwrapApiResponse(data, "프로젝트 롤 수정에 실패했습니다.");
    return {
      id: result.id,
      projectId: result.project_id,
      updated: result.updated,
    };
  },

  async deleteProjectRole(projectId: number, roleId: number): Promise<{ id: number; projectId: number; deleted: boolean }> {
    const { data } = await http.delete<ApiResponse<{ id: number; project_id: number; deleted: boolean }>>(
      `${protoConfig.apiPrefix}/projects/${projectId}/roles/${roleId}`,
    );
    const result = unwrapApiResponse(data, "프로젝트 롤 삭제에 실패했습니다.");
    return {
      id: result.id,
      projectId: result.project_id,
      deleted: result.deleted,
    };
  },

  async rolloffAssignment(id: number, reason?: string): Promise<{ id: number; status: string }> {
    const { data } = await http.put<ApiResponse<{ id: number; status: string }>>(
      `${protoConfig.apiPrefix}/assignments/${id}/rolloff`,
      { reason },
    );
    return unwrapApiResponse(data, "배정 Roll-off에 실패했습니다.");
  },

  async replaceAssignment(id: number, reason?: string): Promise<{ id: number; status: string }> {
    const { data } = await http.put<ApiResponse<{ id: number; status: string }>>(
      `${protoConfig.apiPrefix}/assignments/${id}/replace`,
      { reason },
    );
    return unwrapApiResponse(data, "배정 교체 요청에 실패했습니다.");
  },

  async updateApproval(
    id: number,
    body: { action: "approve" | "reject"; comment?: string; approverName?: string },
  ): Promise<{ id: number; status: string }> {
    const requestBody = {
      action: body.action,
      comment: body.comment,
      approver_name: body.approverName,
    };
    const { data } = await http.put<ApiResponse<{ id: number; status: string }>>(
      `${protoConfig.apiPrefix}/approvals/${id}`,
      requestBody,
    );
    return unwrapApiResponse(data, "승인 처리에 실패했습니다.");
  },
};
