"use client";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { dateKey, parse } from "./cycle";
import { translations, type Locale } from "./i18n";
import {
  BackupError,
  decodeBackup,
  encodeBackup,
  MAX_BACKUP_BYTES,
  type BackupPreview,
  type BackupErrorCode,
  type LunaData as Data,
} from "./backup";
import { BACKUP_ACTIVITY_KEY, backupIsDue } from "./backup-reminder";
import { STORAGE_KEY as KEY } from "./storage";
type Options = {
  data: Data;
  storageError: "" | "loadError" | "saveError";
  locale: Locale;
  today: string;
  save: (data: Data, message?: string) => boolean;
  setToast: (message: string) => void;
  onOpen: () => void;
  onImported: (data: Data) => void;
};
export function useBackup({
  data,
  storageError,
  locale,
  today,
  save,
  setToast,
  onOpen,
  onImported,
}: Options) {
  const t = translations[locale];
  const fileInput = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<BackupPreview | null>(null);
  const [importName, setImportName] = useState("");
  const [importError, setImportError] = useState<BackupErrorCode | "">("");
  const [importBusy, setImportBusy] = useState(false);

  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [metadataReady, setMetadataReady] = useState(false);
  // Read optional browser-only reminder metadata after the loading shell.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      setLastActivity(localStorage.getItem(BACKUP_ACTIVITY_KEY));
    } catch {}
    setMetadataReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  function markBackupActivity() {
    const now = new Date().toISOString();
    setLastActivity(now);
    try {
      localStorage.setItem(BACKUP_ACTIVITY_KEY, now);
    } catch {}
  }
  function clearBackupActivity() {
    setLastActivity(null);
    try {
      localStorage.removeItem(BACKUP_ACTIVITY_KEY);
    } catch {}
  }
  const backupDue =
    metadataReady && backupIsDue(data.periods.length, lastActivity, parse(today).getTime());
  function exportData() {
    let text = encodeBackup(data);
    if (storageError === "loadError") {
      try {
        text = localStorage.getItem(KEY) || text;
      } catch {}
    }
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `luna-backup-${dateKey(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    markBackupActivity();
    setToast(t.exported);
  }
  function chooseImport() {
    fileInput.current?.click();
  }
  async function readImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;
    setImportBusy(true);
    setImportError("");
    setImportPreview(null);
    setImportName(file.name);
    onOpen();
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new BackupError("importTooLarge");
      const preview = decodeBackup(await file.text(), dateKey(new Date()), locale);
      setImportPreview(preview);
    } catch (error) {
      setImportError(error instanceof BackupError ? error.code : "importReadError");
    } finally {
      setImportBusy(false);
    }
  }
  function confirmImport() {
    if (!importPreview) return;
    const restored = importPreview.data;
    if (save(restored, translations[restored.locale ?? locale].imported)) {
      markBackupActivity();
      setImportPreview(null);
      setImportError("");
      onImported(restored);
    }
  }

  return {
    fileInput,
    importPreview,
    importName,
    importError,
    importBusy,
    exportData,
    chooseImport,
    readImport,
    confirmImport,
    backupDue,
    clearBackupActivity,
  };
}
