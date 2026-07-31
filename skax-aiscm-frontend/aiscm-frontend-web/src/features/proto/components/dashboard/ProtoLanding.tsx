"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { protoConfig } from "@/features/proto/config";
import { protoHealthService } from "@/features/proto/services/protoHealthService";
import shared from "../shared/protoPanelShared.module.css";

export default function ProtoLanding() {
  const [result, setResult] = useState<string>("아직 확인하지 않았습니다.");
  const [loading, setLoading] = useState(false);

  const handleCheck = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await protoHealthService.check();
      const status = data.status;
      const scope = data.scope;
      const timestamp = data.timestamp;
      setResult(`연결 성공: status=${status}, scope=${scope}, timestamp=${timestamp}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      setResult(`연결 실패: ${message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  if (!protoConfig.enabled) {
    return (
      <main className={shared.landing}>
        <p className={shared.landingTitleLg}>Proto 기능 비활성화</p>
        <p className={shared.landingBody}>
          `src/config/proto.ts`의 <code>PROTO_ENABLED</code>가 false일 때 표시됩니다.
        </p>
      </main>
    );
  }

  return (
    <main className={shared.landing}>
      <p className={shared.landingTitle}>/proto 샘플 경계 확인</p>
      <p className={shared.landingBody}>
        이 화면은 샘플 전용 URL 경계(<code>{protoConfig.uiPrefix}</code>)에서 동작하며, 백엔드의{" "}
        <code>{`${protoConfig.apiPrefix}/health`}</code>를 확인합니다.
      </p>
      <div>
        <button type="button" className={shared.btn} onClick={() => void handleCheck()} disabled={loading}>
          {loading ? "확인 중..." : "proto API 연결 확인"}
        </button>
      </div>
      <div className={shared.linkRow}>
        <Link href={`${protoConfig.uiPrefix}/dashboard`}>대시보드</Link>
        <Link href={`${protoConfig.uiPrefix}/notifications`}>알림</Link>
        <Link href={`${protoConfig.uiPrefix}/employees`}>직원</Link>
        <Link href={`${protoConfig.uiPrefix}/projects`}>프로젝트</Link>
        <Link href={`${protoConfig.uiPrefix}/scoping`}>스코핑</Link>
        <Link href={`${protoConfig.uiPrefix}/pm-matching`}>PM매칭</Link>
        <Link href={`${protoConfig.uiPrefix}/team-matching`}>팀매칭</Link>
        <Link href={`${protoConfig.uiPrefix}/team-mgmt`}>팀관리</Link>
        <Link href={`${protoConfig.uiPrefix}/inbox`}>인박스</Link>
        <Link href={`${protoConfig.uiPrefix}/matching-logs`}>매칭로그</Link>
        <Link href={`${protoConfig.uiPrefix}/stats`}>통계</Link>
        <Link href={`${protoConfig.uiPrefix}/external`}>외부연동</Link>
        <Link href={`${protoConfig.uiPrefix}/playground`}>UI샘플</Link>
      </div>
      <pre className={shared.landingPre}>{result}</pre>
    </main>
  );
}
