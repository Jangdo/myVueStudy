/**
 * prototype `navVisibility.ts` 정합 — Next `/proto` 확장 ID(projects, stats) 포함.
 */

/** 프로토타입 앱 내비 ID + Next proto 전용 */
export type ProtoShellNavId =
  | "overview"
  | "pm-matching"
  | "team-matching"
  | "team-mgmt"
  | "matching-logs"
  | "inbox"
  | "scoping"
  | "notifications"
  | "employees"
  | "external"
  | "playground"
  | "projects"
  | "stats";

export function canSeeProtoNav(id: ProtoShellNavId, roleUpper: string): boolean {
  const r = roleUpper.toUpperCase();
  switch (id) {
    case "overview":
    case "playground":
    case "notifications":
    case "employees":
      return true;
    case "pm-matching":
      return r === "AM";
    case "scoping":
      return r === "PM" || r === "AM";
    case "team-matching":
      return r === "PM" || r === "AM";
    case "team-mgmt":
    case "matching-logs":
      return r === "AM" || r === "PM";
    case "inbox":
      return r === "BL" || r === "SL";
    case "external":
      return r === "AM" || r === "PM";
    case "projects":
    case "stats":
      return r === "AM" || r === "PM";
    default:
      return false;
  }
}

export type ProtoNavSectionItem = {
  id: ProtoShellNavId;
  label: string;
  href: string;
  badge?: { count: number; variant?: "accent" | "orange" };
  subItems?: Array<{ id: ProtoShellNavId; label: string; href: string }>;
};

export type ProtoNavSection = {
  heading?: string;
  items: ProtoNavSectionItem[];
};

export function filterProtoNavSections(sections: ProtoNavSection[], roleUpper: string): ProtoNavSection[] {
  return sections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => canSeeProtoNav(item.id, roleUpper)),
    }))
    .filter((sec) => sec.items.length > 0);
}
