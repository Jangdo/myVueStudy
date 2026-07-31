import type { ReactNode } from "react";
import { AiTeamingLayoutClient } from "@/app/ai-teaming/AiTeamingLayoutClient";

export default function PubAiteamingLayout({ children }: { children: ReactNode }) {
  return <AiTeamingLayoutClient initialWorkspaceTabs={null}>{children}</AiTeamingLayoutClient>;
}
