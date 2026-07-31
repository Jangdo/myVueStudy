/**
 * 화면ID(권한 DB 키) ↔ Next.js 라우트 경로/트리거 단일 출처
 *
 * 화면ID 규칙(메일): S + 업무구분(AT|DS) + _ + 일련번호3 + 유형(M|P|C)
 *   - 업무구분: AT(AI Teaming), DS(단기수요공급관리)
 *   - 유형: M(메인), P(팝업), C(컴포넌트/탭)
 *
 * 모달 노출 패턴 3가지:
 *   - global  : 루트 layout에 마운트된 client wrapper가 query를 감시하여 표시.
 *               (static export 환경에서 인터셉트 라우트 미지원 → query 트리거 기반 client-mounted 모달 패턴 채택)
 *   - context : 부모 페이지의 @modal 슬롯 + (.)<slug> 인터셉트 라우트.
 *               ※ static export 정책상 현 운영 환경에선 사용 불가. 추후 plan 보완 시 query trigger 패턴으로 재정의 예정.
 *   - shared  : 두 부모 이상에서 공용. URL은 부모 + ?modal=<slug> query 트리거.
 */

export type ScreenType = "main" | "popup" | "component";
export type SystemCode = "AT" | "DS";
export type ModalScope = "global" | "context" | "shared";

export interface QueryTrigger {
  /** query 키 (프로젝트 전체에서 'modal'로 통일) */
  key: string;
  /** query 값 (모달 식별자, 보통 kebab-case slug) */
  value: string;
}

export interface ScreenMeta {
  /** 화면ID (권한 DB 키) */
  id: string;
  /** 업무구분 코드 */
  system: SystemCode;
  /** 유형 */
  type: ScreenType;
  /** 한글 화면명 (병기 표기 가능) */
  name: string;
  /** Next.js 라우트 경로. shared/component면 null */
  path: string | null;
  /** 모달이 호출되는 부모 라우트들. global이면 undefined */
  parents?: string[];
  /** 모달 노출 범위 (popup 유형에서만 의미) */
  scope?: ModalScope;
  /** scope='shared' 또는 scope='global'(client-mounted modal)일 때 query 트리거 정의 */
  queryTrigger?: QueryTrigger;
  /** 동적 세그먼트 임시 기본값 (데이터 미연동 단계용) */
  defaultParams?: Record<string, string>;
}

/** 데이터 미연동 단계에서 사용하는 임시 기본 프로젝트 ID */
export const DEFAULT_PROJECT_ID = "sample-001";

export const SCREEN_MAP = {
  // ===== AI Teaming - Main =====
  SAT_102M: {
    id: "SAT_102M",
    system: "AT",
    type: "main",
    name: "메인화면",
    path: "/ai-teaming",
  },
  SAT_103M: {
    id: "SAT_103M",
    system: "AT",
    type: "main",
    name: "프로젝트 상세 화면",
    path: "/ai-teaming/projects/[projectId]",
    defaultParams: { projectId: DEFAULT_PROJECT_ID },
  },
  SAT_112M: {
    id: "SAT_112M",
    system: "AT",
    type: "main",
    name: "승인 대상 목록 조회",
    path: "/ai-teaming/approvals",
  },
  SAT_113M: {
    id: "SAT_113M",
    system: "AT",
    type: "main",
    name: "승인 처리 결과 조회",
    path: "/ai-teaming/approvals/history",
  },

  // ===== AI Teaming - Popup =====
  SAT_101P: {
    id: "SAT_101P",
    system: "AT",
    type: "popup",
    name: "긴급공지팝업",
    path: "/ai-teaming/notice",
    scope: "global",
    queryTrigger: { key: "modal", value: "urgent-notice" },
  },
  SAT_104P: {
    id: "SAT_104P",
    system: "AT",
    type: "popup",
    name: "역할 추가 팝업",
    path: "/ai-teaming/projects/[projectId]/role-add",
    scope: "context",
    parents: ["/ai-teaming/projects/[projectId]"],
  },
  SAT_105P: {
    id: "SAT_105P",
    system: "AT",
    type: "popup",
    name: "인력 검색 팝업",
    path: "/ai-teaming/projects/[projectId]/member-search",
    scope: "context",
    parents: ["/ai-teaming/projects/[projectId]"],
  },
  // 엑셀에 같은 SAT_106P 행이 두 개("배정요청 결재자 확인 팝업" / "배정취소 승인요청") 존재.
  // 같은 결재자 승인 기능을 공유하므로 단일 ID로 묶고, 공용 컴포넌트 + query 트리거로 호출.
  SAT_106P: {
    id: "SAT_106P",
    system: "AT",
    type: "popup",
    name: "배정요청 결재자 확인 / 배정취소 승인요청 팝업",
    path: null,
    scope: "shared",
    queryTrigger: { key: "modal", value: "approver-confirm" },
    parents: ["/ai-teaming/projects/[projectId]", "/ai-teaming/approvals"],
  },
  SAT_107P: {
    id: "SAT_107P",
    system: "AT",
    type: "popup",
    name: "배정 요청 승인 팝업",
    path: "/ai-teaming/approvals/request-approve",
    scope: "context",
    parents: ["/ai-teaming/approvals"],
  },
  SAT_108P: {
    id: "SAT_108P",
    system: "AT",
    type: "popup",
    name: "상세 프로필 팝업",
    path: "/ai-teaming/projects/[projectId]/profile-detail",
    scope: "context",
    parents: ["/ai-teaming/projects/[projectId]"],
  },
  SAT_109P: {
    id: "SAT_109P",
    system: "AT",
    type: "popup",
    name: "배정 취소 결재자 확인 팝업",
    path: "/ai-teaming/projects/[projectId]/cancel-approver",
    scope: "context",
    parents: ["/ai-teaming/projects/[projectId]"],
  },
  SAT_110P: {
    id: "SAT_110P",
    system: "AT",
    type: "popup",
    name: "역할 정보 수정 팝업",
    path: "/ai-teaming/projects/[projectId]/role-edit",
    scope: "context",
    parents: ["/ai-teaming/projects/[projectId]"],
  },
  SAT_111P: {
    id: "SAT_111P",
    system: "AT",
    type: "popup",
    name: "반려 사유 입력 팝업",
    path: "/ai-teaming/projects/[projectId]/reject-reason",
    scope: "context",
    parents: ["/ai-teaming/projects/[projectId]"],
  },
  SAT_112P: {
    id: "SAT_112P",
    system: "AT",
    type: "popup",
    name: "결재자 변경 팝업",
    path: "/ai-teaming/projects/[projectId]/approver-change",
    scope: "context",
    parents: ["/ai-teaming/projects/[projectId]"],
  },
  SAT_113P: {
    id: "SAT_113P",
    system: "AT",
    type: "popup",
    name: "가중치 조절 팝업",
    path: "/ai-teaming/projects/[projectId]/weight-adjust",
    scope: "context",
    parents: ["/ai-teaming/projects/[projectId]"],
  },
  SAT_114P: {
    id: "SAT_114P",
    system: "AT",
    type: "popup",
    name: "필터 설정 팝업",
    path: "/ai-teaming/projects/[projectId]/filter",
    scope: "context",
    parents: ["/ai-teaming/projects/[projectId]"],
  },

  // ===== AI Teaming - Component =====
  SAT_111C: {
    id: "SAT_111C",
    system: "AT",
    type: "component",
    name: "AI 추천목록 조회",
    path: null,
  },

  // ===== Supply-Demand - Main =====
  SDS_101M: {
    id: "SDS_101M",
    system: "DS",
    type: "main",
    name: "메인화면 현황",
    path: "/supply-demand",
  },
  SDS_102M: {
    id: "SDS_102M",
    system: "DS",
    type: "main",
    name: "Pipeline 별 BR 현황",
    path: "/supply-demand/br-ur/br-by-pipeline",
  },
  SDS_103M: {
    id: "SDS_103M",
    system: "DS",
    type: "main",
    name: "Pipeline별 인력배치 현황",
    path: "/supply-demand/br-ur/staffing-by-pipeline",
  },
  SDS_104M: {
    id: "SDS_104M",
    system: "DS",
    type: "main",
    name: "Pipeline 현황",
    path: "/supply-demand/br-ur/pipeline-status",
  },
  SDS_105M: {
    id: "SDS_105M",
    system: "DS",
    type: "main",
    name: "수요공급Gap",
    path: "/supply-demand/resource/gap",
  },
  SDS_106M: {
    id: "SDS_106M",
    system: "DS",
    type: "main",
    name: "조직별 채용진행 현황",
    path: "/supply-demand/hiring/recruit-by-org",
  },
  SDS_107M: {
    id: "SDS_107M",
    system: "DS",
    type: "main",
    name: "조직별 육성진행 현황",
    path: "/supply-demand/hiring/develop-by-org",
  },
  SDS_108M: {
    id: "SDS_108M",
    system: "DS",
    type: "main",
    name: "5-Tier 연간 실적 관리",
    path: "/supply-demand/tier5/annual-actuals",
  },
  SDS_109M: {
    id: "SDS_109M",
    system: "DS",
    type: "main",
    name: "5-Tier 월 별 추정 관리",
    path: "/supply-demand/tier5/monthly-forecast",
  },
  SDS_110M: {
    id: "SDS_110M",
    system: "DS",
    type: "main",
    name: "Action Item 메인",
    path: "/supply-demand/action-items",
  },
  SDS_111M: {
    id: "SDS_111M",
    system: "DS",
    type: "main",
    name: "Action Item 추가 등록",
    path: "/supply-demand/action-items/new",
  },
  SDS_112M: {
    id: "SDS_112M",
    system: "DS",
    type: "main",
    name: "Action Item 추가 조회",
    path: "/supply-demand/action-items/list",
  },
} as const satisfies Record<string, ScreenMeta>;

export type ScreenId = keyof typeof SCREEN_MAP;

/** 화면ID로 메타 조회 */
export function getScreenById(id: string): ScreenMeta | undefined {
  return (SCREEN_MAP as Record<string, ScreenMeta>)[id];
}

/** pathname으로 메타 역조회 (정적 path만 매칭. 동적 세그먼트 토큰 비교는 별도 처리 필요) */
export function getScreenByPath(pathname: string): ScreenMeta | undefined {
  return Object.values(SCREEN_MAP).find((s) => s.path === pathname);
}

/**
 * screenId의 path에 포함된 [token]을 실제 값으로 치환하여 URL 문자열을 반환합니다.
 * - 우선순위: 인자 `params` > `meta.defaultParams`
 * - path가 null인 화면(공용/컴포넌트)에는 사용 불가 → throw
 * - 치환 후에도 남은 [token]이 있으면 throw (실수 방지)
 *
 * Non-null assertion(`!.`)을 쓰지 않고 `?? + ?.`로 안전하게 처리합니다.
 *
 * @example
 *   buildScreenPath("SAT_103M")
 *     // → "/ai-teaming/projects/sample-001"
 *   buildScreenPath("SAT_103M", { projectId: "PJT-2026-0001" })
 *     // → "/ai-teaming/projects/PJT-2026-0001"
 *   buildScreenPath("SAT_104P", { projectId: "PJT-2026-0001" })
 *     // → "/ai-teaming/projects/PJT-2026-0001/role-add"
 */
export function buildScreenPath(
  id: ScreenId,
  params?: Record<string, string>,
): string {
  // SCREEN_MAP은 `as const satisfies Record<string, ScreenMeta>`로 선언되어
  // SCREEN_MAP[id]가 리터럴 union이 됩니다. union 공통 키만 직접 접근 가능하므로,
  // ScreenMeta 인터페이스로 명시 캐스팅해 옵셔널 필드(defaultParams 등)를 안전하게 다룹니다.
  const meta: ScreenMeta = SCREEN_MAP[id];
  if (meta.path === null) {
    throw new Error(`[buildScreenPath] ${id}는 path가 없는 화면입니다.`);
  }
  const merged: Record<string, string> = {
    ...(meta.defaultParams ?? {}),
    ...(params ?? {}),
  };
  const built = meta.path.replace(/\[(\w+)\]/g, (_match, key: string) => {
    const value = merged[key];
    return value ?? `[${key}]`;
  });
  if (built.includes("[")) {
    throw new Error(
      `[buildScreenPath] ${id} 경로에 미치환 토큰이 남았습니다: ${built}`,
    );
  }
  return built;
}
