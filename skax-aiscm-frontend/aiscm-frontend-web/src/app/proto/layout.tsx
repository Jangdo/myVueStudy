import type { ReactNode } from "react";
import { ProtoThemeProvider } from "@/features/proto/components/layout/ProtoThemeContext";
import ProtoShellLayout from "@/features/proto/components/layout/ProtoShellLayout";
import { ProtoSessionProvider } from "@/features/proto/lib/ProtoSessionContext";
import "@/features/proto/styles/shared/proto-parity-tokens.css";
import "@/features/proto/styles/layout/app-shell-parity.css";
import "@/features/proto/styles/team-matching/teaming-prototype.css";
import "@/features/proto/styles/pm-matching/pm-matching-parity.css";
import "@/features/proto/styles/shared/loading-overlay-parity.css";

interface ProtoLayoutProps {
  children: ReactNode;
}

export default function ProtoLayout({ children }: ProtoLayoutProps) {
  return (
    <ProtoThemeProvider>
      <ProtoSessionProvider>
        <ProtoShellLayout>{children}</ProtoShellLayout>
      </ProtoSessionProvider>
    </ProtoThemeProvider>
  );
}
