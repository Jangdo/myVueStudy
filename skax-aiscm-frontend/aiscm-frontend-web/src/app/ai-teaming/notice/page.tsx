/**
 * SAT_101P 긴급공지팝업 — 직접 URL 진입(딥링크) 시 표시되는 풀페이지.
 * 일반적인 사용 흐름에서는 `@modal` 슬롯의 인터셉트 라우트가 모달로 표시합니다.
 * (화면ID는 `screenMap` / `UrgentNoticeModal` 단일 출처를 따릅니다. page.tsx에서는 export 불가.)
 */
export default function NoticeFullPage() {
  return (
    <main style={{ padding: "24px" }}>
      <h1>긴급 공지 (SAT_101P)</h1>
      <p>이곳에 긴급 공지 내용을 표시합니다. (TODO: 실제 내용 구현)</p>
    </main>
  );
}
