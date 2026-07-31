import { Suspense } from "react";
import ProtoPmMatchingPanel from "@/features/proto/components/pm-matching/ProtoPmMatchingPanel";
import ProtoRouteFallback from "@/app/proto/_components/ProtoRouteFallback";

export default function ProtoPmMatchingPage() {
  return (
    <Suspense fallback={<ProtoRouteFallback />}>
      <ProtoPmMatchingPanel />
    </Suspense>
  );
}
