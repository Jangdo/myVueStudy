import { http } from "@/shared/http/client";
import { unwrapApiResponse } from "@/shared/http/unwrapApiResponse";
import { protoConfig } from "@/features/proto/config";
import type { ApiResponse } from "@/shared/types/api";
import type {
  ProtoDashboardData,
  ProtoEmployeeItem,
  ProtoEmployeeProfileData,
  ProtoMatchingLogItem,
  ProtoNotificationsData,
  ProtoProjectDetailData,
  ProtoProjectCostData,
  ProtoProjectItem,
  ProtoProjectTeamData,
  ProtoApprovalItem,
  ProtoTeamStatsData,
  ProtoUserItem,
} from "@/features/proto/types";

const toDashboardProject = (row: Record<string, unknown>) => ({
  id: Number(row.id ?? 0),
  name: typeof row.name === "string" ? row.name : undefined,
  client: typeof row.client === "string" ? row.client : undefined,
  pipelineStage: typeof row.pipeline_stage === "string" ? row.pipeline_stage : undefined,
  dealSize: typeof row.deal_size === "number" ? row.deal_size : undefined,
  startDate: typeof row.start_date === "string" ? row.start_date : undefined,
  endDate: typeof row.end_date === "string" ? row.end_date : undefined,
  pmName: typeof row.pm_name === "string" ? row.pm_name : null,
  winProbability: typeof row.win_probability === "number" ? row.win_probability : undefined,
  teamTotal: typeof row.team_total === "number" ? row.team_total : undefined,
  teamFilled: typeof row.team_filled === "number" ? row.team_filled : undefined,
  teamPct: typeof row.team_pct === "number" ? row.team_pct : undefined,
});

const toEmployee = (row: Record<string, unknown>): ProtoEmployeeItem => ({
  id: Number(row.id ?? 0),
  name: typeof row.name === "string" ? row.name : "",
  role: typeof row.role === "string" ? row.role : "",
  skills: typeof row.skills === "string" ? row.skills : "",
  team: typeof row.team === "string" ? row.team : "",
  division: typeof row.division === "string" ? row.division : "",
  available: typeof row.available === "string" ? row.available : "N",
  ...row,
  empNo: typeof row.emp_no === "string" ? row.emp_no : undefined,
  domainExpertise: typeof row.domain_expertise === "string" ? row.domain_expertise : undefined,
  isAvailable: typeof row.is_available === "string" ? row.is_available : undefined,
  careerYears: typeof row.career_years === "number" ? row.career_years : undefined,
  performanceScore: typeof row.performance_score === "number" ? row.performance_score : undefined,
  monthlyCost: typeof row.monthly_cost === "number" ? row.monthly_cost : undefined,
});

const toProject = (row: Record<string, unknown>): ProtoProjectItem => ({
  id: Number(row.id ?? 0),
  name: typeof row.name === "string" ? row.name : "",
  stage: typeof row.stage === "string" ? row.stage : "",
  ...row,
  dealSize: typeof row.deal_size === "number" ? row.deal_size : undefined,
  pipelineStage: typeof row.pipeline_stage === "string" ? row.pipeline_stage : undefined,
  pmName: typeof row.pm_name === "string" ? row.pm_name : undefined,
  winProbability: typeof row.win_probability === "number" ? row.win_probability : undefined,
  teamCompositionPct: typeof row.team_composition_pct === "number" ? row.team_composition_pct : undefined,
});

const toApprovals = (rows: Array<Record<string, unknown>>): ProtoApprovalItem[] =>
  rows.map((row) => ({
    id: Number(row.id ?? 0),
    requester: (row.requester as string) ?? "",
    status: (row.status as string) ?? "",
    ...row,
    assignmentId: (row.assignment_id as number | null) ?? null,
    approvalType: (row.approval_type as string) ?? "",
    assignmentType: row.assignment_type as string | undefined,
    approverRole: (row.approver_role as string) ?? "",
    approverName: (row.approver_name as string) ?? "",
    riskLevel: row.risk_level as string | null | undefined,
    riskReason: row.risk_reason as string | null | undefined,
    projectId: (row.project_id as number | null) ?? null,
    projectName: (row.project_name as string) ?? "",
    projectClient: row.project_client as string | null | undefined,
    roleId: (row.role_id as number | null) ?? null,
    roleName: (row.role_name as string) ?? "",
    employeeId: (row.employee_id as number | null) ?? null,
    employeeName: (row.employee_name as string) ?? "",
    employeeRole: (row.employee_role as string) ?? "",
    employeeCl: (row.employee_cl as string) ?? "",
    employeeTeam: (row.employee_team as string) ?? "",
    matchScore: (row.match_score as number | null) ?? null,
    createdAt: (row.created_at as string | null) ?? null,
  }));

export const protoQueryService = {
  async getDashboard(): Promise<ProtoDashboardData> {
    const { data } = await http.get<ApiResponse<unknown>>(
      `${protoConfig.apiPrefix}/dashboard`,
    );
    const result = unwrapApiResponse(data, "대시보드 조회에 실패했습니다.") as Record<string, unknown>;
    return {
      ...(result as unknown as ProtoDashboardData),
      projects: Array.isArray(result.projects)
        ? result.projects.map((p) => toDashboardProject((p ?? {}) as Record<string, unknown>))
        : [],
    };
  },

  async getUsers(): Promise<ProtoUserItem[]> {
    const { data } = await http.get<ApiResponse<ProtoUserItem[]>>(
      `${protoConfig.apiPrefix}/users`,
    );
    return unwrapApiResponse(data, "사용자 조회에 실패했습니다.");
  },

  async getNotifications(role = "AM"): Promise<ProtoNotificationsData> {
    const { data } = await http.get<ApiResponse<unknown>>(
      `${protoConfig.apiPrefix}/notifications`,
      { params: { role } },
    );
    const result = unwrapApiResponse(data, "알림 조회에 실패했습니다.") as Record<string, unknown>;
    return {
      ...(result as unknown as ProtoNotificationsData),
      unreadCount: typeof result.unread_count === "number"
        ? (result.unread_count as number)
        : 0,
    };
  },

  async getEmployees(filters?: {
    role?: string;
    available?: string;
    name?: string;
    skills?: string;
    team?: string;
    division?: string;
  }): Promise<ProtoEmployeeItem[]> {
    const { data } = await http.get<ApiResponse<unknown>>(
      `${protoConfig.apiPrefix}/employees`,
      { params: filters },
    );
    const result = unwrapApiResponse(data, "직원 조회에 실패했습니다.");
    return Array.isArray(result)
      ? result.map((r) => toEmployee((r ?? {}) as Record<string, unknown>))
      : [];
  },

  async getProjects(user = "am"): Promise<ProtoProjectItem[]> {
    const { data } = await http.get<ApiResponse<unknown>>(
      `${protoConfig.apiPrefix}/projects`,
      { params: { user } },
    );
    const result = unwrapApiResponse(data, "프로젝트 조회에 실패했습니다.");
    return Array.isArray(result)
      ? result.map((r) => toProject((r ?? {}) as Record<string, unknown>))
      : [];
  },

  async getProjectDetail(id: number): Promise<ProtoProjectDetailData> {
    const { data } = await http.get<ApiResponse<unknown>>(
      `${protoConfig.apiPrefix}/projects/${id}`,
    );
    const result = unwrapApiResponse(data, "프로젝트 상세 조회에 실패했습니다.") as Record<string, unknown>;
    return {
      ...(result as unknown as ProtoProjectDetailData),
      dealSize: typeof result.deal_size === "number" ? result.deal_size : undefined,
      pipelineStage: typeof result.pipeline_stage === "string" ? result.pipeline_stage : undefined,
      pmName: typeof result.pm_name === "string" ? result.pm_name : undefined,
      winProbability: typeof result.win_probability === "number" ? result.win_probability : undefined,
      teamCompositionPct: typeof result.team_composition_pct === "number" ? result.team_composition_pct : undefined,
    };
  },

  async getProjectTeam(id: number): Promise<ProtoProjectTeamData> {
    const { data } = await http.get<ApiResponse<ProtoProjectTeamData>>(
      `${protoConfig.apiPrefix}/projects/${id}/team`,
    );
    return unwrapApiResponse(data, "프로젝트 팀 조회에 실패했습니다.");
  },

  async getProjectCost(id: number): Promise<ProtoProjectCostData> {
    const { data } = await http.get<ApiResponse<unknown>>(
      `${protoConfig.apiPrefix}/projects/${id}/cost`,
    );
    const result = unwrapApiResponse(data, "프로젝트 비용 조회에 실패했습니다.") as Record<string, unknown>;
    return {
      ...(result as unknown as ProtoProjectCostData),
      projectId: (result.project_id as number) ?? 0,
      totalLaborCost: (result.total_labor_cost as number) ?? 0,
      budgetRemaining: (result.budget_remaining as number) ?? 0,
      budgetUtilizationPct: (result.budget_utilization_pct as number) ?? 0,
      lineItems: Array.isArray(result.line_items)
        ? (result.line_items as Array<Record<string, unknown>>)
        : [],
    };
  },

  async getMatchingLogs(projectId?: number): Promise<ProtoMatchingLogItem[]> {
    const { data } = await http.get<ApiResponse<ProtoMatchingLogItem[]>>(
      `${protoConfig.apiPrefix}/matching/logs`,
      { params: projectId ? { projectId } : undefined },
    );
    return unwrapApiResponse(data, "매칭 로그 조회에 실패했습니다.");
  },

  async getTeamStats(projectId?: number): Promise<ProtoTeamStatsData> {
    const { data } = await http.get<ApiResponse<ProtoTeamStatsData>>(
      `${protoConfig.apiPrefix}/stats/team/${projectId ?? 1001}`,
    );
    return unwrapApiResponse(data, "팀 통계 조회에 실패했습니다.");
  },

  async getApprovals(role?: string): Promise<ProtoApprovalItem[]> {
    const { data } = await http.get<ApiResponse<unknown>>(
      `${protoConfig.apiPrefix}/approvals`,
      { params: role ? { role } : undefined },
    );
    const result = unwrapApiResponse(data, "승인 목록 조회에 실패했습니다.");
    return Array.isArray(result)
      ? toApprovals(result as Array<Record<string, unknown>>)
      : [];
  },

  async matchPm(body: {
    projectId: number;
    weights?: Record<string, number> | string;
    topN?: number;
    user?: string;
  }): Promise<{
    project?: Record<string, unknown>;
    candidates?: Array<Record<string, unknown>>;
  }> {
    // 백엔드는 weights를 JSON 문자열로 받음 (Jackson String 역직렬화)
    const payload = {
      project_id: body.projectId,
      top_n: body.topN,
      user: body.user,
      weights:
        body.weights == null
          ? undefined
          : typeof body.weights === "string"
            ? body.weights
            : JSON.stringify(body.weights),
    };
    const { data } = await http.post<ApiResponse<{
      project?: Record<string, unknown>;
      candidates?: Array<Record<string, unknown>>;
    }>>(`${protoConfig.apiPrefix}/matching/pm`, payload);
    return unwrapApiResponse(data, "PM 매칭 실행에 실패했습니다.");
  },

  async matchTeam(body: {
    projectId: number;
    roleId: number;
    weights?: Record<string, number> | string;
    topN?: number;
    user?: string;
  }): Promise<{
    project?: Record<string, unknown>;
    role?: Record<string, unknown>;
    candidates?: Array<Record<string, unknown>>;
  }> {
    const payload = {
      project_id: body.projectId,
      role_id: body.roleId,
      top_n: body.topN,
      user: body.user,
      weights:
        body.weights == null
          ? undefined
          : typeof body.weights === "string"
            ? body.weights
            : JSON.stringify(body.weights),
    };
    const { data } = await http.post<ApiResponse<{
      project?: Record<string, unknown>;
      role?: Record<string, unknown>;
      candidates?: Array<Record<string, unknown>>;
    }>>(`${protoConfig.apiPrefix}/matching/team`, payload);
    return unwrapApiResponse(data, "팀 매칭 실행에 실패했습니다.");
  },

  async getEmployeeDetail(id: number): Promise<ProtoEmployeeItem> {
    const { data } = await http.get<ApiResponse<ProtoEmployeeItem>>(
      `${protoConfig.apiPrefix}/employees/${id}`,
    );
    return unwrapApiResponse(data, "직원 상세 조회에 실패했습니다.");
  },

  /** 와이어는 백엔드 `ProtoEmployeeProfileResponse`와 동일(snake_case·중첩 키 혼합). 아래에서 `ProtoEmployeeProfileData`로 정규화한다. */
  async getEmployeeProfile(id: number, params?: {
    projectId?: number;
    roleId?: number;
    matchType?: string;
    weights?: string;
  }): Promise<ProtoEmployeeProfileData> {
    const requestParams = params
      ? {
          project_id: params.projectId,
          role_id: params.roleId,
          match_type: params.matchType,
          weights: params.weights,
        }
      : undefined;
    const { data } = await http.get<ApiResponse<unknown>>(
      `${protoConfig.apiPrefix}/employees/${id}/profile`,
      { params: requestParams },
    );
    const result = unwrapApiResponse(data, "직원 프로필 조회에 실패했습니다.") as Record<string, unknown>;
    return {
      ...(result as unknown as ProtoEmployeeProfileData),
      projectId: (result.project_id as number) ?? 0,
      roleId: (result.role_id as number) ?? 0,
      matchType: (result.match_type as string) ?? "",
      scoreBreakdown: (result.score_breakdown as ProtoEmployeeProfileData["scoreBreakdown"]) ?? {
        skill: 0,
        availability: 0,
        domain: 0,
        workload: 0,
      },
      fit: (result.fit as Record<string, unknown> | undefined)
        ? {
            ...(result.fit as ProtoEmployeeProfileData["fit"]),
            matchType: String((result.fit as Record<string, unknown>).match_type ?? ""),
            label: String((result.fit as Record<string, unknown>).label ?? ""),
            score: ((result.fit as Record<string, unknown>).score as number | null | undefined) ?? null,
            status: String((result.fit as Record<string, unknown>).status ?? ""),
            statusLabel: String((result.fit as Record<string, unknown>).status_label ?? ""),
            reason: String((result.fit as Record<string, unknown>).reason ?? ""),
            weights: ((result.fit as Record<string, unknown>).weights as Record<string, number> | undefined) ?? {},
            details: ((result.fit as Record<string, unknown>).details as Record<string, number> | undefined) ?? {},
          }
        : undefined,
      trackRecords: Array.isArray(result.track_records)
        ? (result.track_records as ProtoEmployeeProfileData["trackRecords"])
        : [],
      trackRecordCount: (result.track_record_count as number) ?? 0,
      employee: toEmployee((result.employee as Record<string, unknown>) ?? {}),
    };
  },
};
