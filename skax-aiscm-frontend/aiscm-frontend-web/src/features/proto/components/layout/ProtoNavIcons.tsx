import type { ReactNode } from "react";

/** prototype AppShell `navIconById`와 동일 */
export function protoNavIconById(id: string): ReactNode {
  switch (id) {
    case "overview":
      return (
        <svg className="app-shell__nav-icon" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5" />
          <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" />
          <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".3" />
          <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5" />
        </svg>
      );
    case "pm-matching":
      return (
        <svg className="app-shell__nav-icon" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M1 14c0-3 2-5 5-5s5 2 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M11 7l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "team-mgmt":
      return (
        <svg className="app-shell__nav-icon" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect x="1" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
          <rect x="10" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
          <rect x="5.5" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 7v2M3.5 9V8H8M12.5 9V8H8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "scoping":
      return (
        <svg className="app-shell__nav-icon" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5 8h6M5 5h4M5 11h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "team-matching":
      return (
        <svg className="app-shell__nav-icon" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 3v5l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "inbox":
      return (
        <svg className="app-shell__nav-icon" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M1 10l3-7h8l3 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M1 10h4l1 2h4l1-2h4v3H1v-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case "notifications":
      return (
        <svg className="app-shell__nav-icon" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M8 1a4 4 0 0 1 4 4v3l1.5 2H2.5L4 8V5a4 4 0 0 1 4-4z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M6 13a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "employees":
      return (
        <svg className="app-shell__nav-icon" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4" />
          <path d="M2.5 14c.5-3.1 2.5-5 5.5-5s5 1.9 5.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "matching-logs":
      return (
        <svg className="app-shell__nav-icon" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M2 3h12M2 8h12M2 13h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "playground":
      return (
        <svg className="app-shell__nav-icon" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3 2h10v12H3z" stroke="currentColor" strokeWidth="1.4" />
          <path d="M6 5h4M6 8h4M6 11h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "external":
      return (
        <svg className="app-shell__nav-icon" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M6 3H3v10h10v-3" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 8l5-5M9 3h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "projects":
      return (
        <svg className="app-shell__nav-icon" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3 6h10M6 3v10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "stats":
      return (
        <svg className="app-shell__nav-icon" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M2 13V7M6 13V4M10 13v-5M14 13V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg className="app-shell__nav-icon" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5 8h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
  }
}
