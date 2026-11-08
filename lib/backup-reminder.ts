// Separate, optional UI metadata; never part of menstrual records or backup files.
export const BACKUP_ACTIVITY_KEY = "luna-backup-activity-v1";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export function backupIsDue(
  periodCount: number,
  lastActivity: string | null,
  now: number,
): boolean {
  if (periodCount === 0) return false;
  const last = lastActivity === null ? NaN : Date.parse(lastActivity);
  return !Number.isFinite(last) || last > now + 24 * 60 * 60 * 1000 || now - last >= WEEK_MS;
}
