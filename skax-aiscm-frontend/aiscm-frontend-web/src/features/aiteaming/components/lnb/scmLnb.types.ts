/** Figma `SCM_LNB` (533:1320) Type 속성 */
export type ScmLnbType = "영업" | "입찰" | "계약" | "수행";

const SCM_LNB_TYPES: ScmLnbType[] = ["영업", "입찰", "계약", "수행"];

/** 쿼리 `?phase=입찰` 등에서 안전하게 파싱 */
export function parseScmLnbType(raw: string | null | undefined, fallback: ScmLnbType = "영업"): ScmLnbType {
  if (raw && (SCM_LNB_TYPES as readonly string[]).includes(raw)) {
    return raw as ScmLnbType;
  }
  return fallback;
}
