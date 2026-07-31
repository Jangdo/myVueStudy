# 멀티 스테이지 빌드: 빌더 단계 LTS 버전
ARG IMAGE_BASE_URI=docker.io/library/
FROM ${IMAGE_BASE_URI}node:22.14.0-alpine AS builder

WORKDIR /usr/src/app

# 빌드 인자 정의
ARG NODE_ENV=production
ARG NPM_REGISTRY=https://registry.npmjs.org/
#ARG NPM_REGISTRY=https://nexus.skax.co.kr/repository/dev-npm-proxy/
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8081

# 환경 변수 설정 (빌드 시점에 주입)
ENV NODE_ENV=${NODE_ENV}
ENV NPM_REGISTRY=${NPM_REGISTRY}
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# Nexus registry 설정
RUN npm config set registry "${NPM_REGISTRY}" && \
  npm config set @skax:registry "${NPM_REGISTRY}"

# 종속성 설치 최적화
COPY package.json package-lock.json* ./
RUN npm ci --silent --no-audit --prefer-offline --include=dev --registry "${NPM_REGISTRY}"

# 소스 코드 복사 (필요한 파일만)
COPY src/ ./src/
# Next 정적 export 시 public/ 이 없으면 out/ 에 assets 가 포함되지 않아 SVG·favicon 404
COPY public/ ./public/
COPY next.config.ts ./
COPY next-env.d.ts ./
COPY tsconfig.json ./
COPY .eslintrc.json ./

# 프로덕션 빌드 실행
RUN npm run build

# 최종 nginx 이미지 생성
FROM ${IMAGE_BASE_URI}nginx:1.28.0-alpine

# NGINX 포트 설정 (nginx.conf와 일치하는지 확인)
ENV PORT=3000

# 보안 강화: 비루트 사용자로 실행
RUN addgroup -g 1001 -S nginx-group && \
  adduser -u 1001 -S nginx-user -G nginx-group && \
  # base nginx.conf의 'user' 지시어 제거 (non-root 실행 시 경고/오류 방지)
  sed -i '/^user /d' /etc/nginx/nginx.conf && \
  # pid 파일 경로를 non-root 쓰기 가능 위치로 변경
  sed -i 's|pid\s*/var/run/nginx.pid;|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf && \
  sed -i 's|pid\s*/run/nginx.pid;|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf && \
  chown -R nginx-user:nginx-group /usr/share/nginx/html && \
  chown -R nginx-user:nginx-group /var/cache/nginx && \
  mkdir -p /var/log/nginx && \
  chown -R nginx-user:nginx-group /var/log/nginx && \
  chown -R nginx-user:nginx-group /etc/nginx/conf.d

# Nginx 구성 설정
RUN rm /etc/nginx/conf.d/default.conf
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# 빌드된 앱 복사 (정적 export 결과물은 out 디렉터리에 생성됨)
COPY --from=builder --chown=nginx-user:nginx-group /usr/src/app/out /usr/share/nginx/html

# 컨테이너가 정상 실행 중인지 확인하기 위한 헬스 체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# 비루트 사용자로 전환
USER nginx-user

# 컨테이너 실행 시 노출할 포트
EXPOSE 3000

# 엔트리포인트 스크립트 대신 직접 Nginx 실행
CMD ["nginx", "-g", "daemon off;"]