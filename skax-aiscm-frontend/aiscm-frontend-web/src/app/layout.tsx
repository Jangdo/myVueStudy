import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import "/src/shared/styles/globals.css";
import { QueryProvider } from "./providers/QueryProvider";
import { UrgentNoticeModal } from "@/features/notice/components/UrgentNoticeModal";

export const metadata: Metadata = {
  title: "AI SCM",
  description: "AI SCM",
  icons: {
    icon: "/axgenticwire-mark.svg",
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          {children}
          {/* SAT_101P 전역 긴급공지팝업 — `?modal=urgent-notice` query를 감시하는 client-mounted 모달.
              useSearchParams 사용 컴포넌트는 Suspense boundary가 필수입니다. */}
          <Suspense fallback={null}>
            <UrgentNoticeModal />
          </Suspense>
        </QueryProvider>
      </body>
    </html>
  );
}
