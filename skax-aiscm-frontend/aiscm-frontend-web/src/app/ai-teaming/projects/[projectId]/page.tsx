import { DEFAULT_PROJECT_ID } from "@/config/screenMap";
import { AiTeamingProjectsPageClient } from "./AiTeamingProjectsPageClient";

/**
 * 본 라우트 화면ID: SAT_103M (`screenMap` 단일 출처). page.tsx에서는 screenId export 불가(Next 규약).
 *
 * `next.config.ts`의 `output: 'export'` 정책상 본 동적 세그먼트는
 * 빌드 시점에 정적 생성할 projectId 목록을 명시해야 합니다.
 *
 * - proto/demo 단계: DEFAULT_PROJECT_ID(`sample-001`) 1건만 정적 생성.
 *   필요 시 샘플 ID를 배열에 추가하면 해당 ID에 대한 정적 HTML이 함께 생성됩니다.
 * - ToBe 정식 단계 진입 시: `output: 'export'` 자체를 제거하고
 *   동적 세그먼트를 runtime으로 처리하도록 전환을 권장합니다(plan §11 단계별 정책 메모 참고).
 */
export function generateStaticParams() {
  return [{ projectId: DEFAULT_PROJECT_ID }];
}

interface PageProps {
  // Next.js 15에서 dynamic route params는 Promise로 전달됩니다.
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { projectId } = await params;
  return <AiTeamingProjectsPageClient projectId={projectId} />;
}
