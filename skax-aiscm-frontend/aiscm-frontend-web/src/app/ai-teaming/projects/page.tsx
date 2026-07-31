import { redirect } from "next/navigation";
import { buildScreenPath } from "@/config/screenMap";

/**
 * SAT_103M 프로젝트 상세의 디폴트 진입 페이지.
 * 데이터 미연동 단계에서는 DEFAULT_PROJECT_ID('sample-001')로 redirect.
 * 추후 실제 프로젝트 목록 페이지로 승격되면 본 redirect는 제거합니다.
 */
export default function ProjectsIndexPage() {
  redirect(buildScreenPath("SAT_103M"));
}
