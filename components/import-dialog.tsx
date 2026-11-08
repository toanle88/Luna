"use client";
import { Check, LockKeyhole, Download, Upload, FileJson, LoaderCircle, Info } from "lucide-react";
import { resolveTracking } from "../lib/cycle";
import type { LunaController } from "../lib/use-luna";
import { Modal } from "./modal";
export function ImportDialog({
  data,
  storageError,
  today,
  setModal,
  fileInput,
  importPreview,
  importName,
  importError,
  importBusy,
  t,
  fmt,
  openSettings,
  exportData,
  chooseImport,
  readImport,
  confirmImport,
}: Pick<
  LunaController,
  | "data"
  | "storageError"
  | "today"
  | "setModal"
  | "fileInput"
  | "importPreview"
  | "importName"
  | "importError"
  | "importBusy"
  | "t"
  | "fmt"
  | "openSettings"
  | "exportData"
  | "chooseImport"
  | "readImport"
  | "confirmImport"
>) {
  return (
    <Modal title={t.importTitle} close={() => setModal(null)} closeLabel={t.close}>
      <p className="modal-intro">{t.importIntro}</p>
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={readImport}
      />
      <div className="backup-file">
        <FileJson size={24} />
        <div>
          <span>{t.importFile}</span>
          <strong>{importName}</strong>
        </div>
      </div>
      {importBusy && (
        <p className="import-loading" role="status">
          <LoaderCircle size={18} />
          {t.importReading}
        </p>
      )}
      {importError && (
        <p className="error" role="alert">
          {t[importError]}
        </p>
      )}
      {importPreview && (
        <>
          <dl className="backup-preview">
            <div className="preview-wide">
              <dt>{t.trackingMode}</dt>
              <dd>{importPreview.data.trackingMode === "manual" ? t.manualMode : t.autoMode}</dd>
            </div>
            <div>
              <dt>{t.importPeriodCount}</dt>
              <dd>{importPreview.data.periods.length}</dd>
            </div>
            <div>
              <dt>{t.cycleLength}</dt>
              <dd>{t.days(resolveTracking(importPreview.data, today).cycleLength)}</dd>
            </div>
            <div>
              <dt>{t.periodLength}</dt>
              <dd>{t.days(resolveTracking(importPreview.data, today).periodLength)}</dd>
            </div>
            <div>
              <dt>{t.language}</dt>
              <dd>{importPreview.data.locale === "en" ? "English" : "Tiếng Việt"}</dd>
            </div>
            <div className="preview-wide">
              <dt>{t.importDateRange}</dt>
              <dd>
                {importPreview.data.periods.length
                  ? (() => {
                      const dates = importPreview.data.periods.map((p) => p.start).sort();
                      return `${fmt(dates[0], { day: "numeric", month: "short", year: "numeric" })} – ${fmt(dates[dates.length - 1], { day: "numeric", month: "short", year: "numeric" })}`;
                    })()
                  : t.importNoPeriods}
              </dd>
            </div>
            {importPreview.exportedAt && (
              <div className="preview-wide">
                <dt>{t.importSavedAt}</dt>
                <dd>
                  {new Date(importPreview.exportedAt).toLocaleString(t.locale, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
            )}
          </dl>
          <p className="import-replace-note">
            <Info size={16} />
            <span>{t.importReplaceInfo(data.periods.length)}</span>
          </p>
          <button className="secondary full" onClick={exportData}>
            <Download size={16} />
            {t.export}
          </button>
          {storageError === "saveError" && (
            <p className="error" role="alert">
              {t.saveError}
            </p>
          )}
          <button className="primary full import-confirm" onClick={confirmImport}>
            <Check size={16} />
            {t.importConfirm}
          </button>
        </>
      )}
      <div className="import-footer-actions">
        <button className="text-btn" disabled={importBusy} onClick={chooseImport}>
          <Upload size={13} />
          {t.importChoose}
        </button>
        <button className="text-btn" onClick={openSettings}>
          {t.importCancel}
        </button>
      </div>
      <div className="form-note">
        <LockKeyhole size={13} />
        {t.importLocal}
      </div>
    </Modal>
  );
}
