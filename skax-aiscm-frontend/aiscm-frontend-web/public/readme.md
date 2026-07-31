# 퍼블리셔 핸드오프 가이드

AI SCM Frontend 의 퍼블리싱 작업 공간(`public/pubs/`) 사용법을 안내합니다.
퍼블리셔는 React/Next/TS 빌드를 거치지 않고, **통짜 HTML/CSS/JS** 파일만 작성해서 이 폴더에 두면 됩니다.

---

## 1. 작업 공간 위치

| 구분 | 폴더 | 용도 |
| --- | --- | --- |
| 퍼블 페이지 | `public/pubs/` | 퍼블리셔가 자유롭게 페이지 폴더를 만드는 작업 공간 |
| 공유 자원 (SSoT) | `public/assets/` | 퍼블리셔와 개발자가 함께 참조하는 css/이미지/폰트/js |

> 개발자(React) 영역인 `src/` 하위는 절대 수정하지 마세요. 마찬가지로 개발자는 `public/pubs/`를 임의로 수정하지 않습니다.

---

## 2. URL 매핑 규칙

`public/` 하위의 파일은 Next.js 가 빌드 시 그대로 사이트 루트(`/`)로 복사됩니다.

| 실제 파일 경로 | 접근 URL |
| --- | --- |
| `public/pubs/index.html` | `/pubs/` |
| `public/pubs/test1/index.html` | `/pubs/test1/` |
| `public/pubs/foo/bar/index.html` | `/pubs/foo/bar/` |
| `public/assets/css/aiteaming.css` | `/assets/css/aiteaming.css` |
| `public/readme.md` | `/readme.md` |

> 폴더 안에 `index.html` 만 두면 운영(nginx) 또는 `npm run dev:pub` 정적 서버에서 디렉토리 인덱스가 자동 매칭됩니다. **Next dev 서버(`npm run dev`)는 디렉토리 인덱스 자동 매칭을 지원하지 않으므로** 거기서는 명시적 파일명(`/pubs/test1/index.html`)으로 접근해야 합니다. 자세한 내용은 아래 §6 을 참고하세요.

---

## 3. 새 페이지 추가하는 방법

1. `public/pubs/` 아래에 페이지 이름으로 폴더를 만듭니다.
   - 예: `public/pubs/aiteaming-detail/`
2. 폴더 안에 `index.html` 을 작성합니다.
3. 페이지 전용 자원(전용 CSS/JS/이미지)은 **같은 폴더 안**에 함께 둡니다.

```
public/pubs/aiteaming-detail/
├── index.html          # 페이지 본문
├── style.css           # (선택) 페이지 전용 CSS
├── script.js           # (선택) 페이지 전용 JS
└── hero.png            # (선택) 페이지 전용 이미지
```

페이지 전용 자원은 **상대경로**로 참조해도 됩니다.

```html
<link rel="stylesheet" href="./style.css" />
<script src="./script.js" defer></script>
<img src="./hero.png" alt="hero" />
```

---

## 4. 공유 자원 사용 방법 (`/assets/...`)

여러 페이지에서 공통으로 쓰는 자원은 `public/assets/` 에 두고 **절대경로**로 참조하세요.
이렇게 해야 페이지 폴더 깊이와 무관하게 동일한 경로로 쓸 수 있고, 개발자(React) 영역과도 같은 자원을 공유할 수 있습니다.

| 자원 종류 | 저장 위치 | 참조 예시 |
| --- | --- | --- |
| CSS | `public/assets/css/` | `<link rel="stylesheet" href="/assets/css/aiteaming.css" />` |
| 이미지 | `public/assets/images/` | `<img src="/assets/images/common/logo.svg" alt="logo" />` |
| 폰트 | `public/assets/fonts/` | `@font-face { src: url("/assets/fonts/Pretendard.woff2"); }` |
| JS  | `public/assets/js/` | `<script src="/assets/js/common.js" defer></script>` |

> **상대경로(`../../`) 대신 절대경로(`/assets/...`)** 를 사용해 주세요. 페이지를 다른 폴더로 옮겨도 깨지지 않습니다.

---

## 5. 권장 작성 규칙

- 파일/폴더 이름은 **영문 소문자 + 하이픈** 권장 (예: `aiteaming-detail`, `recommend-modal.css`)
- HTML 최상단에 `<!doctype html>`, `<html lang="ko">`, `<meta charset="utf-8" />`, `<meta name="viewport" ...>` 포함
- 외부 라이브러리는 가능한 한 **자체 호스팅** (CDN 사용 시 CSP 정책에 추가 필요할 수 있음)
- 절대경로는 항상 `/` 로 시작합니다. (`/assets/...` ⭕, `assets/...` ❌)

---

## 6. 로컬에서 확인하기

퍼블 페이지는 두 가지 방법으로 확인할 수 있습니다. 용도에 따라 선택하세요.

### 방법 1 — Next dev 서버 (포트 3000): React 페이지 hot-reload 용

`npm run dev`

> Next dev 서버는 `public/` 하위 **디렉토리 자동 인덱스 매칭을 지원하지 않습니다.**
> 즉 `/pubs/test1/` 같은 URL은 404 가 됩니다. 퍼블 페이지를 dev 서버에서 빠르게 확인하려면 **명시적 파일명**으로 접근하세요.

- 퍼블 인덱스: `http://localhost:3000/pubs/index.html`
- 샘플 1: `http://localhost:3000/pubs/test1/index.html`
- 샘플 2: `http://localhost:3000/pubs/test2/index.html`
- 공유 CSS 직접 확인: `http://localhost:3000/assets/css/aiteaming.css`

### 방법 2 — 퍼블 전용 정적 서버 (포트 3001): 운영(nginx)과 동일한 동작

`npm run dev:pub`

> `serve` 패키지로 `public/` 폴더를 그대로 정적 서빙합니다. 디렉토리 자동 인덱스가 동작하므로 **운영 nginx와 같은 URL 패턴** 그대로 검증할 수 있습니다. 퍼블 작업 중에는 이쪽을 띄워두면 편합니다.

- 퍼블 인덱스: `http://localhost:3001/pubs/` (슬래시 없이 `/pubs` 도 자동 redirect)
- 샘플 1: `http://localhost:3001/pubs/test1/`
- 샘플 2: `http://localhost:3001/pubs/test2/`
- 공유 CSS: `http://localhost:3001/assets/css/aiteaming.css`
- 가이드 문서: `http://localhost:3001/readme.md`

> 이 서버는 `public/` 만 서빙하므로 React 페이지(`/aiteaming`, `/proto` 등)는 응답하지 않습니다. React 영역까지 한 서버에서 같이 확인하고 싶다면 운영과 동일하게 `npm run build` 후 nginx 또는 `npx serve out` 으로 띄우세요.

---

## 7. 자주 묻는 질문

**Q1. 페이지 안에서 React 컴포넌트(예: `<AiTeamingRightSidebar />`)를 쓸 수 있나요?**

아니요. 이 폴더는 통짜 HTML 전용입니다. React 컴포넌트가 필요한 작업은 개발자에게 마크업/스타일을 전달해 주시면 됩니다.

**Q2. 페이지 폴더 안의 자원을 다른 페이지에서 가져다 써도 되나요?**

가능하지만 비추천입니다. 페이지를 옮기거나 삭제할 때 다른 페이지가 깨질 수 있으니, **공유 자원은 `public/assets/`** 로 옮겨 절대경로로 참조하세요.

**Q3. 페이지가 안 보여요 (404).**

- **Next dev 서버(포트 3000)에서 `/pubs/test1/` 형태로 접근 중인가요?** → Next dev 서버 한계입니다. 명시적으로 `/pubs/test1/index.html` 로 접근하거나, `npm run dev:pub` 으로 띄운 포트 3001 의 정적 서버를 사용하세요. (위 §6 참고)
- 폴더 안에 `index.html` 이 있는지 확인.
- 파일 이름의 대소문자가 일치하는지 확인 (Linux/운영 서버는 대소문자 구분).
- 운영 환경(nginx)에서는 `/pubs/test1/` 와 `/pubs/test1` 모두 정상 동작합니다. dev 서버에서만 발생하는 한계점입니다.

**Q4. CSS 가 적용되지 않아요.**

- 절대경로 앞에 `/` 가 빠지지 않았는지 확인 (`/assets/css/...`).
- 브라우저 캐시 무효화: 강제 새로고침(Ctrl+F5) 또는 DevTools → Disable cache.

---

작성 중 막히는 부분이 있으면 개발자에게 문의해 주세요.
