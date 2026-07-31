export interface ProtoDashboardWidget {
  id: string;
  label: string;
  /** KPI 숫자( pipeline_size 는 억 단위 합계, FE에서 ₩ 표기 시 ×1e8 ) */
  value: number;
}

/** prototype DashboardPanel 하단 테이블·파이프라인 카드용 */
export interface ProtoDashboardProject {
  id: number;
  name?: string;
  client?: string;
  pipelineStage?: string;
  dealSize?: number;
  startDate?: string;
  endDate?: string;
  pmName?: string | null;
  winProbability?: number;
  teamTotal?: number;
  teamFilled?: number;
  teamPct?: number;
}

export interface ProtoDashboardData {
  title: string;
  widgets: ProtoDashboardWidget[];
  projects?: ProtoDashboardProject[];
  updatedAt: number;
}

export interface ProtoNotificationItem {
  id: number;
  title?: string;
  message: string;
  /** prototype notifications.notification_type */
  notificationType?: string;
  role: string;
  isRead: boolean;
  /** prototype link_page — 대시보드 알림 미리보기 내비용 */
  linkPage?: string;
  /** ISO 또는 DB 문자열 — 상대시간 표시용 */
  createdAt?: string;
}

export interface ProtoNotificationsData {
  role: string;
  notifications: ProtoNotificationItem[];
  unreadCount: number;
}

export interface ProtoEmployeeItem {
  id: number;
  empNo?: string;
  name: string;
  role: string;
  cl?: string;
  domainExpertise?: string;
  skills: string;
  team: string;
  division: string;
  isAvailable?: string;
  available: string;
  careerYears?: number;
  performanceScore?: number;
  monthlyCost?: number;
}

export interface ProtoProjectItem {
  id: number;
  name: string;
  stage: string;
  /** 팀 배정 화면 배지·필터 — 백엔드 `selectProjects` 확장 필드 */
  client?: string;
  dealSize?: number;
  pipelineStage?: string;
  pmName?: string;
  winProbability?: number;
  teamCompositionPct?: number;
}

export interface ProtoProjectDetailData extends ProtoProjectItem {
  owner: string;
  budget: number;
  priority: string;
  roles?: Array<{
    id: number;
    projectId: number;
    roleName: string;
    quantity: number;
    filled: number;
  }>;
  assignments?: Array<{
    id: number;
    projectId: number;
    roleId: number;
    employeeId: number;
    status: string;
    startDate: string | null;
    endDate: string | null;
    employeeName: string;
    employeeRole: string;
    employeeCl: string;
  }>;
}

export interface ProtoEmployeeProfileRecommendation {
  type: string;
  message: string;
}

export interface ProtoEmployeeProfileData {
  employee: ProtoEmployeeItem;
  projectId: number;
  roleId: number;
  matchType: string;
  weights: string;
  score: number;
  scoreBreakdown: {
    skill: number;
    availability: number;
    domain: number;
    workload: number;
  };
  recommendations: ProtoEmployeeProfileRecommendation[];
  fit?: {
    matchType: string;
    label: string;
    score: number | null;
    status: string;
    statusLabel: string;
    reason: string;
    weights: Record<string, number>;
    details: Record<string, number>;
  };
  trackRecords?: Array<{
    assignmentId: number;
    employeeId: number;
    projectId: number;
    roleId: number;
    projectName: string;
    roleName: string;
    assignmentStatus: string;
    startDate: string | null;
    endDate: string | null;
    matchScore: number;
  }>;
  trackRecordCount?: number;
}

export interface ProtoMatchingLogItem {
  id: number;
  projectId: number;
  matchType: string;
  score: number;
}

export interface ProtoTeamStatsData {
  projectId: number;
  headcount: number;
  assigned: number;
  pending: number;
  utilization: number;
}

export interface ProtoUserItem {
  id: string;
  name: string;
  role: string;
  title: string;
  desc: string;
}

export interface ProtoApprovalItem {
  id: number;
  assignmentId: number | null;
  approvalType: string;
  assignmentType?: string;
  requester: string;
  approverRole: string;
  approverName: string;
  status: string;
  riskLevel?: string | null;
  riskReason?: string | null;
  projectId: number | null;
  projectName: string;
  projectClient?: string | null;
  roleId: number | null;
  roleName: string;
  employeeId: number | null;
  employeeName: string;
  employeeRole: string;
  employeeCl: string;
  employeeTeam: string;
  matchScore: number | null;
  createdAt: string | null;
}

export interface ProtoProjectTeamData {
  project: Record<string, unknown>;
  roles: Array<Record<string, unknown>>;
}

export interface ProtoProjectCostData {
  projectId: number;
  budget: number;
  totalLaborCost: number;
  budgetRemaining: number;
  budgetUtilizationPct: number;
  lineItems: Array<Record<string, unknown>>;
}
