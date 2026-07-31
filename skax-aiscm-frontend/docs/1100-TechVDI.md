# Tech VDI 초기 환경 설정 가이드

본 문서는 개발 환경 (VDI) 구성을 위한 필수 설정 단계를 안내합니다.

## 1. WSL 및 Docker 사전 설정

Windows Subsystem for Linux (WSL) 기능을 활성화하고 기본 버전을 2로 설정합니다. PowerShell을 **관리자 권한**으로 실행하여 아래 명령어를 입력하세요.

```powershell
# WSL 기능 활성화
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# WSL 기본 버전을 2로 설정
wsl --set-default-version 2
```

## 2. Docker 이미지 가져오기

오프라인 환경에서 제공받은 `.tar` 파일을 통해 필요한 Docker 이미지를 로드합니다.

```bash
# 로컬 이미지 파일 로드
docker load -i ./scm_images_x64.tar

# 정상적으로 로드되었는지 이미지 목록 확인
docker images
```

## 3. Frontend (NPM) 저장소 설정

내부 망의 넥서스(Nexus) 저장소를 NPM Registry로 설정하여 패키지를 다운로드할 수 있도록 구성합니다.

```bash
npm config set registry https://nexus.skax.co.kr/repository/dev-npm-proxy/
```

## 4. DBeaver Maven Repository 설정

DB 연동 시 필요한 드라이버를 내부 저장소에서 다운로드하도록 설정합니다.

1. **메뉴 이동**: `환경설정 > 연결 > 드라이버 > 메이븐`
2. **저장소 추가**: `Add` 버튼 클릭
3. **URL 입력**: `https://nexus.skax.co.kr/repository/maven-public/`
4. **우선순위 변경**: 등록한 저장소를 선택하고 `Up` 버튼을 클릭하여 **최상단**으로 이동시킵니다.
5. **기존 저장소 비활성화**: 나머지 기존 저장소들은 모두 선택 후 `Disable` 처리합니다.
6. **적용 및 재시작**: `Apply and Close` 클릭 후 DBeaver 프로그램을 재시작합니다.

## 5. GitHub Git 설정 및 소스코드 Clone

Git 사용자 정보를 등록하고, 내부망에서 발생할 수 있는 SSL 인증서 오류 방지를 위해 SSL Backend를 설정합니다.

### 5.1 Git 전역 설정

```bash
# 사용자 정보 등록 (본인 정보로 변경)
git config --global user.name "본인영문이름"
git config --global user.email "이메일@sk.com"

# SSL Backend 설정
git config --global http.sslBackend openssl
```

### 5.2 소스코드 Clone

저장소를 Clone 할 때 인증 팝업이 나타납니다. 비밀번호 대신 **Personal Access Token(classic)**을 사용해야 합니다.
* **토큰 발급 주소**: [https://github.com/settings/tokens](https://github.com/settings/tokens)
* **Username**: 본인 GitHub 계정
* **Password**: 발급받은 Personal Access Token

```bash
# 프로젝트 저장소 Clone
git clone -b feature-260416-CICD --single-branch https://github.com/skax-internal/skax-aiscm-backend.git
git clone -b feature-260416-CICD --single-branch https://github.com/skax-internal/skax-aiscm-frontend.git
```

### 🔙 Navigation
- [README.md 로 돌아가기](../../README.md#tech-vdi-초기-환경-설정-가이드)
