import { Suspense } from "react";
import ProtoTeamMatchingPanel from "@/features/proto/components/team-matching/ProtoTeamMatchingPanel";
import ProtoRouteFallback from "@/app/proto/_components/ProtoRouteFallback";

export default function ProtoTeamMatchingPage() {
  return (
    <Suspense fallback={<ProtoRouteFallback />}>
      <ProtoTeamMatchingPanel />
    </Suspense>
  );
}
