import { Suspense } from "react";
import ProtoNotificationsPanel from "@/features/proto/components/notifications/ProtoNotificationsPanel";
import ProtoRouteFallback from "@/app/proto/_components/ProtoRouteFallback";

export default function ProtoNotificationsPage() {
  return (
    <Suspense fallback={<ProtoRouteFallback />}>
      <ProtoNotificationsPanel />
    </Suspense>
  );
}
