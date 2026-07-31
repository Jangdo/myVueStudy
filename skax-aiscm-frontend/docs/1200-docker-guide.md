# 로컬 환경 Docker Compose 실행 가이드

본 문서는 SCM 애플리케이션(프론트엔드, 백엔드, 데이터베이스 등)을 로컬 환경에서 통합 실행하고 테스트하기 위한 Docker Compose 가이드입니다.

## 1. 구성 요소 및 포트 정보

| 서비스 | 역할 | 로컬 접근 주소 | 내부 포트 |
| :--- | :--- | :--- | :--- |
| **postgres** | 메인 데이터베이스 (PostgreSQL 17) | `localhost:5432` | 5432 |
| **redis** | 세션/캐시 저장소 (Redis 8) | `localhost:6379` | 6379 |
| **aiscm-common-service** | 공통 서비스 백엔드 | `http://localhost:8082` | 8080 |
| **aiscm-api-gateway** | API 게이트웨이 백엔드 | `http://localhost:8081` | 8080 |
| **aiscm-frontend-web** | 관리자 웹 프론트엔드 | `http://localhost:3000` | 3000 |

> **💡 포트 매핑 참고**: 백엔드 서비스들은 컨테이너 내부적으로 모두 `8080` 포트를 사용합니다. 로컬 충돌을 방지하기 위해 Gateway는 `8081`, Common은 `8082`로 외부 개방되어 있습니다.

## 2. 사전 준비

* **Docker & Docker Compose**: 시스템에 설치되어 동작 중이어야 합니다. (Docker Desktop 등)
* **이미지 로드**: 사전에 제공된 로컬 이미지(`scm_images_x64.tar`)가 등록되어 있어야 합니다. ([300-TechVDI.md](./300-TechVDI.md) 참고)

## 3. 실행 및 상태 확인

프로젝트 최상단(`docker-compose.yml` 위치) 터미널에서 아래 명령을 실행합니다.

### 3.1 서비스 실행

```bash
# 백그라운드 실행 및 소스코드 변경 반영(빌드)
docker compose up -d --build
```

### 3.2 프로세스 상태 확인

```bash
# 구동 중인 컨테이너 상태 확인 (모두 'Up' 상태인지 확인)
docker compose ps
```

## 4. 로그 모니터링

문제 발생 시 각 컨테이너의 로그를 통해 원인을 파악할 수 있습니다.

```bash
# 전체 컨테이너 실시간 로그 확인
docker compose logs -f

# 특정 서비스의 로그만 확인 (예: aiscm-frontend-web)
docker compose logs -f aiscm-frontend-web
```

## 5. 서비스 종료 및 데이터 초기화

```bash
# 컨테이너만 안전하게 종료 (데이터 유지)
docker compose down

# ⚠️ 컨테이너 종료 및 매핑된 볼륨(DB 데이터 등)까지 완전히 초기화
docker compose down -v
```

## 6. 개발 팁

* **환경 분리 테스트**: 백엔드 로컬 개발 시에는 `docker compose up -d postgres redis` 명령어로 데이터베이스 컨테이너만 실행한 후, 애플리케이션은 IDE(`gradlew bootRun`)에서 개별 실행할 수 있습니다.
* **프론트엔드 API 호출**: 프론트엔드에서 API 통신 시, Host URL은 API 게이트웨이 주소인 `http://localhost:8081` 을 가리키도록 설정해야 합니다.


### 🔙 Navigation
- [README.md 로 돌아가기](../../README.md#tech-vdi-내에-docker-compose-실행-가이드)
