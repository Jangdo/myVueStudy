/** prototype `userKey` → 알림/역할용 대문자 역할 */
export function roleFromUserKey(userKey: string): string {
  const k = userKey.trim().toLowerCase();
  if (k === "am") return "AM";
  if (k === "pm") return "PM";
  if (k === "bl") return "BL";
  if (k === "sl") return "SL";
  if (k.startsWith("pm_")) return "PM";
  return "AM";
}
