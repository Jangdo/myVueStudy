import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",  // 정적 빌드(S3·nginx 배포) 시에만 활성화. 활성화하면 모든 동적 라우트에 generateStaticParams() 필수
  /** 정적 호스트(S3·nginx) + next/image 시 필수에 가깝다 */
  images: {
    unoptimized: true,
  },
  /** 동적 `[projectCode]` HTML 는 generateStaticParams 에 나열한 코드만 생성된다 */
};

export default nextConfig;