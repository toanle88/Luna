"use client";
import { useEffect, useState, type FormEvent } from "react";
import {
  dateKey,
  parse,
  add,
  diff,
  validDate,
  formatDate,
  includesDate,
  validPeriod,
  estimatedEnd,
  resolveTracking,
  type TrackingMode,
  hasOverlap,
  variableHistory,
  projectionForDate,
  phaseAt,
  type Period,
} from "../lib/cycle";
import { translations, type Locale } from "../lib/i18n";
import { usePwa } from "../lib/use-pwa";
import { prepareData, type LunaData as Data, type Entry } from "../lib/backup";
import { useBackup } from "./use-backup";
import { STORAGE_KEY as KEY } from "./storage";
const fresh = (): Data => ({
  version: 1,
  locale: "vi",
  trackingMode: "auto",
  cycleLength: 28,
  periodLength: 5,
  periods: [],
  entries: {},
});

export function useLuna() {
  const [data, setData] = useState<Data>(fresh);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<"" | "loadError" | "saveError">("");
  const [today, setToday] = useState(dateKey(new Date()));
  const [selected, setSelected] = useState(dateKey(new Date()));
  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [tab, setTab] = useState("Overview");
  const [modal, setModal] = useState<"period" | "settings" | "reset" | "install" | "import" | null>(
    null,
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [start, setStart] = useState("");
  const [error, setError] = useState<"" | "invalidStart" | "periodOverlap">("");
  const [settingsError, setSettingsError] = useState(false);
  const [toast, setToast] = useState("");
  const [mode, setMode] = useState<TrackingMode>("auto");
  const [cycle, setCycle] = useState(28);
  const [length, setLength] = useState(5);
  const pwa = usePwa();
  const locale: Locale = data.locale === "en" ? "en" : "vi";
  const t = translations[locale];
  const effective = resolveTracking(data, today);
  const draftEffective = resolveTracking(
    { ...data, trackingMode: mode, cycleLength: cycle, periodLength: length },
    today,
  );
  const fmt = (s: string, opts?: Intl.DateTimeFormatOptions) => formatDate(s, t.locale, opts);
  // localStorage and the local calendar are browser-only. Hydrate them once
  // after the server's loading shell to avoid server/client date mismatches.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (
          d.version !== 1 ||
          !Array.isArray(d.periods) ||
          !d.entries ||
          typeof d.entries !== "object" ||
          Array.isArray(d.entries) ||
          !Number.isInteger(d.cycleLength) ||
          d.cycleLength < 15 ||
          d.cycleLength > 90 ||
          !Number.isInteger(d.periodLength) ||
          d.periodLength < 1 ||
          d.periodLength > 31 ||
          !d.periods.every(validPeriod) ||
          (d.trackingMode !== undefined &&
            d.trackingMode !== "auto" &&
            d.trackingMode !== "manual") ||
          !Object.entries(d.entries).every(
            ([key, e]) =>
              validDate(key) &&
              !!e &&
              typeof e === "object" &&
              typeof (e as Entry).mood === "string" &&
              Array.isArray((e as Entry).symptoms) &&
              (e as Entry).symptoms.every((x) => typeof x === "string") &&
              typeof (e as Entry).note === "string",
          )
        )
          throw Error();
        setData(
          prepareData({ ...d, locale: d.locale === "en" ? "en" : "vi" }, dateKey(new Date())),
        );
      }
    } catch {
      setStorageError("loadError");
    }
    const localToday = dateKey(new Date());
    setToday(localToday);
    setSelected(localToday);
    setMonth(new Date(parse(localToday).getFullYear(), parse(localToday).getMonth(), 1));
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title =
      locale === "vi" ? "Luna — Theo dõi chu kỳ của bạn" : "Luna — Your cycle, at your pace";
  }, [locale]);
  useEffect(() => {
    const id = setInterval(() => setToday(dateKey(new Date())), 60000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(id);
  }, [toast]);
  function save(next: Data, message?: string) {
    try {
      const prepared = prepareData(next, today);
      localStorage.setItem(KEY, JSON.stringify(prepared));
      setData(prepared);
      setStorageError("");
      if (message) setToast(message);
      return true;
    } catch {
      setStorageError("saveError");
      return false;
    }
  }
  const periods = [...data.periods].sort((a, b) => b.start.localeCompare(a.start));
  const last = periods.find((p) => p.start <= today);
  const next = last ? add(last.start, effective.cycleLength) : null;
  const until = next ? diff(next, today) : null;
  const current = periods.find((p) => includesDate(p, today, effective.periodLength));
  const limited = variableHistory(periods);
  const chartPeriod = periods.find((p) => p.start <= selected) || last || periods[0];
  const selectedModel = projectionForDate(
    periods,
    selected,
    effective.cycleLength,
    effective.periodLength,
    limited,
  );
  const selectedPhase = phaseAt(selectedModel, selected);
  function selectDate(date: string) {
    setSelected(date);
    setMonth(new Date(parse(date).getFullYear(), parse(date).getMonth(), 1));
  }
  const loggingEffective = resolveTracking(
    { ...data, periods: data.periods.filter((p) => p.id !== editing) },
    today,
  );
  const nextLoggedStart = periods
    .map((p) => p.start)
    .filter((date) => date > start)
    .sort()[0];
  const draftEnd = validDate(start) ? estimatedEnd(start, loggingEffective.periodLength) : null;
  const calculatedEnd =
    draftEnd && nextLoggedStart && add(nextLoggedStart, -1) < draftEnd
      ? add(nextLoggedStart, -1)
      : draftEnd;
  function openSettings() {
    setMode(effective.mode);
    setCycle(data.cycleLength);
    setLength(data.periodLength);
    setSettingsError(false);
    setModal("settings");
  }
  function openPeriod(date = selected) {
    setEditing(null);
    setStart(date > today ? today : date);
    setError("");
    setModal("period");
  }
  function editPeriod(p: Period) {
    setEditing(p.id);
    setStart(p.start);
    setError("");
    setModal("period");
  }
  function logPeriod(e: FormEvent) {
    e.preventDefault();
    if (!validDate(start) || start > today) {
      setError("invalidStart");
      return;
    }
    const others = data.periods.filter((p) => p.id !== editing);
    if (others.some((p) => p.start === start)) {
      setError("periodOverlap");
      return;
    }
    const period: Period = {
      id: editing || crypto.randomUUID(),
      start,
      end: estimatedEnd(start, effective.periodLength),
      autoEnd: true,
    };
    const candidate = prepareData({ ...data, periods: [...others, period] }, today);
    if (hasOverlap(candidate.periods, resolveTracking(candidate, today).periodLength)) {
      setError("periodOverlap");
      return;
    }
    if (save(candidate, t.savedPeriod)) setModal(null);
  }
  function saveSettings(e: FormEvent) {
    e.preventDefault();
    const candidate = prepareData(
      {
        ...data,
        trackingMode: mode,
        cycleLength: mode === "manual" ? cycle : data.cycleLength,
        periodLength: mode === "manual" ? length : data.periodLength,
      },
      today,
    );
    if (hasOverlap(candidate.periods, resolveTracking(candidate, today).periodLength)) {
      setSettingsError(true);
      return;
    }
    if (save(candidate, t.preferencesSaved)) setModal(null);
  }

  const backup = useBackup({
    data,
    storageError,
    locale,
    today,
    save,
    setToast,
    onOpen: () => setModal("import"),
    onImported: (restored) => {
      setMode(restored.trackingMode ?? "auto");
      setCycle(restored.cycleLength);
      setLength(restored.periodLength);
      setSettingsError(false);

      selectDate(today);
      setTab("Overview");
      setModal(null);
    },
  });
  function resetData() {
    if (save(fresh(), t.cleared)) {
      backup.clearBackupActivity();
      setModal(null);
    }
  }
  return {
    data,
    ready,
    storageError,
    today,
    selected,
    setSelected,
    month,
    setMonth,
    tab,
    setTab,
    modal,
    setModal,
    editing,
    start,
    setStart,
    error,
    settingsError,
    setSettingsError,
    toast,
    mode,
    setMode,
    cycle,
    setCycle,
    length,
    setLength,
    pwa,
    locale,
    t,
    effective,
    draftEffective,
    fmt,
    save,
    periods,
    last,
    next,
    until,
    current,
    limited,
    chartPeriod,
    selectedModel,
    selectedPhase,
    selectDate,
    loggingEffective,
    calculatedEnd,
    openSettings,
    openPeriod,
    editPeriod,
    logPeriod,
    saveSettings,
    ...backup,
    resetData,
  };
}
export type LunaController = ReturnType<typeof useLuna>;
