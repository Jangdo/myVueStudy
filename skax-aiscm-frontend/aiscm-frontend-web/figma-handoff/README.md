# Figma → ToBe 수입 대기

Figma(또는 내보내기 플러그인)가 준 **4개 파일**을 **이관 전** 여기에 붙여 둡니다. 정식 ToBe 소스는 `src/components/...` 등에 이관합니다(`.cursor/rules/frontend.figma-to-react.mdc`).

## 구조

- `figma-handoff/<컴포넌트-슬러그>/` — 컴포넌트마다 한 폴더(예: `checkbox`)
- `_template/` — 복제용 빈 틀(4파일)

## 4개 파일

| 파일 | 용도 |
|------|------|
| `index.jsx` | 컴포넌트 구현 |
| `style.css` | 컴포넌트용 스타일 |
| `styleguide.css` | 토큰/테마(이관 시 토큰 한곳으로 집약) |
| `usage.jsx` | 사용 예 **JSX** (예: `<Checkbox className="..." state="unchecked" />`) |

`usage`는 React 코드 형식이며, ToBe로 옮길 때 `usage.jsx` 권장.

## 이관 후(정식 `src`)

- `styleguide`·Figma variables 는 `src/styles/common/tokens.css`(및 `globals.css`) 쪽 **토큰**으로 집약.  
- 공통 컴포넌트는 `src/components/common/<이름>/` + **props + `data-*` + `*.module.css` + `var(--ui-*)`**. 샘플: `common/Button/`.  
- **이관 PR마다** 공통 모아보기 **`/sample/common`** — `src/app/sample/common/page.tsx`에 섹션·사용 예를 **추가**한다(팀 룰: `frontend.figma-to-react` §1.3).
