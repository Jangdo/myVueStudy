/** prototype `shared/lib/jsonArrays` — API 배열/JSON 문자열 정규화 */
export function coerceStringList(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s || s.toLowerCase() === "null") return [];
    if (s.startsWith("[")) {
      try {
        const parsed = JSON.parse(s) as unknown;
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {
        return [];
      }
    }
    return [];
  }
  return [];
}
