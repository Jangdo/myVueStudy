import { Suspense } from "react";
import ProtoTeamManagementPanel from "@/features/proto/components/team-mgmt/ProtoTeamManagementPanel";
import ProtoRouteFallback from "@/app/proto/_components/ProtoRouteFallback";

export default function ProtoTeamManagementPage() {
  return (
    <Suspense fallback={<ProtoRouteFallback />}>
      <ProtoTeamManagementPanel />
    </Suspense>
  );
}
