import type { AiTeamingOpportunityCardModel } from "@/features/aiteaming/lib/opportunityCardModel";
import type { AiTeamingStaffingMember } from "@/features/aiteaming/components/project-detail/team/teamMembersFromApi";

export function getMockOpportunityCardModel(projectCode: string): AiTeamingOpportunityCardModel {
  return {
    opportunityCode: `OPP-${projectCode}`,
    opportunityName: "A은행 역외 원화결제시스템 통합 고도화",
    수행기간: "2026.04.01 ~ 2026.12.31",
    프로젝트타입: "SI-구축형",
    고객사: "A은행",
    총사업예산: "8500000000",
    수주목표금액: "9200000000",
    수주귀속조직: "금융영업1본부",
    영업대표: "홍길동",
    매출귀속조직: "금융Delivery센터",
  };
}

export function getMockStaffingMembers(projectCode: string): AiTeamingStaffingMember[] {
  return [
    {
      id: `${projectCode}-pm-001`,
      role: "PM",
      statCdNorm: "hard-booked",
      status: { label: "투입예정", variant: "orange" },
      person: { name: "김프로", rank: "PL", team: "금융개발팀", empId: "E10001" },
      skill: { jobLine: "프로젝트관리", skillLabels: ["대형SI"] },
      competency: ["대규모 PMO 운영", "금융권 시스템 구축"],
      period: { main: "26.04.01 - 26.12.31", sub: "Full-Time · 9MM" },
      amount: { main: "180,000,000", sub: "M/M | 20,000,000" },
    },
    {
      id: `${projectCode}-dev-002`,
      role: "Application architect",
      statCdNorm: "soft-booked",
      status: { label: "투입가능", variant: "green" },
      person: { name: "이아키", rank: "수석", team: "아키텍처랩", empId: "E10002" },
      skill: { jobLine: "MSA 설계", skillLabels: ["Spring Boot", "PostgreSQL"] },
      competency: ["마이크로서비스 전환", "성능 최적화"],
      period: { main: "26.05.01 - 26.10.31", sub: "Part-Time · 6MM" },
      amount: { main: "132,000,000", sub: "M/M | 22,000,000" },
    },
    {
      id: `${projectCode}-qa-003`,
      role: "QA",
      statCdNorm: "unassigned",
      status: { label: "투입가능", variant: "green" },
      unassigned: true,
      skill: { jobLine: "테스트 자동화", skillLabels: ["Playwright"] },
      competency: ["회귀 테스트 자동화", "품질 게이트 운영"],
      period: { main: "26.07.01 - 26.11.30", sub: "— · 4MM" },
      amount: { main: "64,000,000", sub: "M/M | 16,000,000" },
    },
  ];
}
