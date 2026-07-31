import { redirect } from "next/navigation";
import { buildScreenPath } from "@/config/screenMap";

/** 루트는 AI Teaming 프로젝트 상세(SAT_103M) 진입으로 통일. */
export default function HomePage() {
  redirect(buildScreenPath("SAT_103M"));
}
