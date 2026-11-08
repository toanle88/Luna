import {
  validDate,
  validPeriod,
  normalizePeriods,
  hasOverlap,
  resolveTracking,
  type TrackingMode,
  type Period,
} from "./cycle";
import type { Locale } from "./i18n";
export type Entry = { mood: string; symptoms: string[]; note: string };
export type LunaData = {
  version: 1;
  locale?: Locale;
  trackingMode?: TrackingMode;
  cycleLength: number;
  periodLength: number;
  periods: Period[];
  entries: Record<string, Entry>;
};
export function prepareData(data: LunaData, today: string): LunaData {
  const effective = resolveTracking(data, today);
  return {
    ...data,
    trackingMode: effective.mode,
    periods: normalizePeriods(data.periods, effective.periodLength),
  };
}
export type BackupPreview = { data: LunaData; exportedAt: string | null };
export type BackupErrorCode =
  | "importInvalidJson"
  | "importInvalidData"
  | "importUnsupportedVersion"
  | "importDuplicate"
  | "importOverlap"
  | "importFutureDate"
  | "importTooLarge"
  | "importReadError";
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
export class BackupError extends Error {
  constructor(public code: BackupErrorCode) {
    super(code);
    this.name = "BackupError";
  }
}
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const integer = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
export function decodeBackup(
  text: string,
  today: string,
  fallbackLocale: Locale = "vi",
): BackupPreview {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES)
    throw new BackupError("importTooLarge");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    throw new BackupError("importInvalidJson");
  }
  if (!record(parsed)) throw new BackupError("importInvalidData");
  let root: unknown = parsed;
  let exportedAt: string | null = null;
  if ("format" in parsed) {
    if (parsed.format !== "luna-backup") throw new BackupError("importInvalidData");
    if (parsed.backupVersion !== 1) throw new BackupError("importUnsupportedVersion");
    if (typeof parsed.exportedAt !== "string" || !Number.isFinite(Date.parse(parsed.exportedAt)))
      throw new BackupError("importInvalidData");
    exportedAt = parsed.exportedAt;
    root = parsed.data;
  }
  if (!record(root)) throw new BackupError("importInvalidData");
  if (!("version" in root)) throw new BackupError("importInvalidData");
  if (root.version !== 1) throw new BackupError("importUnsupportedVersion");
  if (
    !integer(root.cycleLength, 15, 90) ||
    !integer(root.periodLength, 1, 31) ||
    !Array.isArray(root.periods) ||
    root.periods.length > 10000 ||
    !root.periods.every(validPeriod) ||
    (root.locale !== undefined && root.locale !== "vi" && root.locale !== "en") ||
    (root.trackingMode !== undefined &&
      root.trackingMode !== "auto" &&
      root.trackingMode !== "manual")
  )
    throw new BackupError("importInvalidData");
  const ids = new Set<string>(),
    starts = new Set<string>();
  const periods: Period[] = root.periods.map((value) => {
    const p = value as Period;
    if (!p.id.trim() || p.id.length > 200) throw new BackupError("importInvalidData");
    if (ids.has(p.id) || starts.has(p.start)) throw new BackupError("importDuplicate");
    ids.add(p.id);
    starts.add(p.start);
    if (p.start > today) throw new BackupError("importFutureDate");
    return {
      id: p.id,
      start: p.start,
      end: p.end,
      ...(p.autoEnd !== undefined ? { autoEnd: p.autoEnd } : {}),
    };
  });

  const rawEntries = root.entries === undefined ? {} : root.entries;
  if (!record(rawEntries) || Object.keys(rawEntries).length > 40000)
    throw new BackupError("importInvalidData");
  const entries: Record<string, Entry> = {};
  for (const [key, value] of Object.entries(rawEntries)) {
    if (
      !validDate(key) ||
      !record(value) ||
      typeof value.mood !== "string" ||
      value.mood.length > 100 ||
      !Array.isArray(value.symptoms) ||
      value.symptoms.length > 100 ||
      !value.symptoms.every((v) => typeof v === "string" && v.length <= 200) ||
      typeof value.note !== "string" ||
      value.note.length > 2000
    )
      throw new BackupError("importInvalidData");
    entries[key] = {
      mood: value.mood,
      symptoms: [...value.symptoms] as string[],
      note: value.note,
    };
  }
  const data = prepareData(
    {
      version: 1,
      locale: root.locale ?? fallbackLocale,
      trackingMode: root.trackingMode ?? "auto",
      cycleLength: root.cycleLength,
      periodLength: root.periodLength,
      periods,
      entries,
    },
    today,
  );
  if (hasOverlap(data.periods, resolveTracking(data, today).periodLength))
    throw new BackupError("importOverlap");
  return { data, exportedAt };
}
export function encodeBackup(data: LunaData, exportedAt = new Date().toISOString()): string {
  return JSON.stringify({ format: "luna-backup", backupVersion: 1, exportedAt, data }, null, 2);
}
