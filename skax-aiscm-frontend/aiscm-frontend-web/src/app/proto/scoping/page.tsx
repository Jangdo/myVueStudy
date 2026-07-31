import { Suspense } from "react";
import ProtoScopingPanel from "@/features/proto/components/scoping/ProtoScopingPanel";
import ProtoRouteFallback from "@/app/proto/_components/ProtoRouteFallback";

export default function ProtoScopingPage() {
  return (
    <Suspense fallback={<ProtoRouteFallback />}>
      <ProtoScopingPanel />
    </Suspense>
  );
}
