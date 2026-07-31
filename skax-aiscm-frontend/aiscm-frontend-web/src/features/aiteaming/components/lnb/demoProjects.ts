import type { ScmLnbType } from "./scmLnb.types";

export type DemoProjectRow = { id: string; name: string; phase: ScmLnbType };

/** LNB 데모 목록 — `generateStaticParams`와 동기화 필요 (`output: "export"` + nginx) */
export const AITEAMING_DEMO_PROJECT_ROWS: DemoProjectRow[] = [
  { id: "30133549-D001", name: "테_SI플젝명:30133549-D001", phase: "입찰" },
  { id: "30133584-D001", name: "테_SI플젝명:30133584-D001", phase: "입찰" },
  { id: "30133633-D001", name: "테_사업기회명:30133633", phase: "입찰" },
];

/** 예전 데모·퍼블 경로용 코드 — LNB 행과 합쳐 정적 HTML을 모두 생성 */
const LEGACY_STATIC_PROJECT_CODES = ["30133549-D001", "30133584-D001", "30133633-D001"] as const;

/** `[projectCode]` 정적 export용 — 목록에 없는 경로는 nginx가 index.html로 떨어뜨리며 루트 redirect(D123)가 실행될 수 있음 */
export function generateAiteamingProjectStaticParams(): { projectCode: string }[] {
  const codes = new Set<string>([...LEGACY_STATIC_PROJECT_CODES]);
  for (const p of AITEAMING_DEMO_PROJECT_ROWS) {
    codes.add(p.id);
  }
  return [...codes].map((projectCode) => ({ projectCode }));
}
