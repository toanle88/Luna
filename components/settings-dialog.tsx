"use client";
import { version as appVersion } from "../package.json";
import { Check, Trash2, Download, Upload } from "lucide-react";
import { type Locale } from "../lib/i18n";
import { InstallPanel } from "./luna-install";
import type { LunaController } from "../lib/use-luna";
import { Modal } from "./modal";
export function SettingsDialog({
  data,
  setModal,
  settingsError,
  setSettingsError,
  mode,
  setMode,
  cycle,
  setCycle,
  length,
  setLength,
  fileInput,
  importBusy,
  pwa,
  locale,
  t,
  draftEffective,
  save,
  saveSettings,
  exportData,
  backupDue,
  chooseImport,
  readImport,
}: Pick<
  LunaController,
  | "data"
  | "setModal"
  | "settingsError"
  | "setSettingsError"
  | "mode"
  | "setMode"
  | "cycle"
  | "setCycle"
  | "length"
  | "setLength"
  | "fileInput"
  | "importBusy"
  | "pwa"
  | "locale"
  | "t"
  | "draftEffective"
  | "save"
  | "saveSettings"
  | "exportData"
  | "backupDue"
  | "chooseImport"
  | "readImport"
>) {
  return (
    <Modal title={t.preferences} close={() => setModal(null)} closeLabel={t.close}>
      <p className="modal-intro">{t.preferencesIntro}</p>
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={readImport}
      />
      <label className="language-label">
        {t.language}
        <select
          value={locale}
          onChange={(e) => save({ ...data, locale: e.target.value as Locale })}
        >
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
      </label>
      <form onSubmit={saveSettings}>
        <fieldset className="tracking-modes">
          <legend>{t.trackingMode}</legend>
          {(["auto", "manual"] as const).map((value) => (
            <label className={mode === value ? "is-active" : ""} key={value}>
              <input
                type="radio"
                name="tracking-mode"
                value={value}
                checked={mode === value}
                onChange={() => {
                  setMode(value);
                  setSettingsError(false);
                }}
              />
              <span>
                <strong>{value === "auto" ? t.autoMode : t.manualMode}</strong>
                <small>{value === "auto" ? t.autoModeHint : t.manualModeHint}</small>
              </span>
              {mode === value && <Check size={15} />}
            </label>
          ))}
        </fieldset>
        {mode === "auto" ? (
          <div className="auto-values">
            <div>
              <span>{t.cycleLength}</span>
              <strong>{t.days(draftEffective.cycleLength)}</strong>
              <small>
                {draftEffective.cycleSamples
                  ? t.autoLearned(draftEffective.cycleSamples)
                  : t.autoCycleFallback}
              </small>
            </div>
            <div>
              <span>{t.periodLength}</span>
              <strong>{t.days(draftEffective.periodLength)}</strong>
              <small>
                {draftEffective.periodSamples
                  ? t.autoPeriodLearned(draftEffective.periodSamples)
                  : t.autoPeriodFallback}
              </small>
            </div>
          </div>
        ) : (
          <div className="settings-fields">
            <label>
              {t.cycleLength}
              <span className="optional">{t.dayUnit}</span>
              <input
                required
                type="number"
                min={15}
                max={90}
                value={cycle}
                onChange={(e) => {
                  setCycle(Number(e.target.value));
                  setSettingsError(false);
                }}
              />
            </label>
            <label>
              {t.periodLength}
              <span className="optional">{t.dayUnit}</span>
              <input
                required
                type="number"
                min={1}
                max={31}
                value={length}
                onChange={(e) => {
                  setLength(Number(e.target.value));
                  setSettingsError(false);
                }}
              />
            </label>
          </div>
        )}
        <p className="subtle">{mode === "auto" ? t.manualSavedHint : t.preferencesHint}</p>
        {mode === "auto" && (
          <details className="auto-method">
            <summary>{t.autoMethodTitle}</summary>
            <p>{t.autoMethod}</p>
            {draftEffective.ignoredIntervals > 0 && (
              <p>{t.autoIgnored(draftEffective.ignoredIntervals)}</p>
            )}
          </details>
        )}
        {settingsError && (
          <p className="error" role="alert">
            {t.settingsOverlap}
          </p>
        )}
        <button type="submit" className="primary full">
          {t.savePreferences}
        </button>
      </form>
      <div className="data-settings backup-settings">
        <h3>{t.backupHeading}</h3>
        <p>{t.backupHint}</p>
        <p>{t.backupPlaintext}</p>
        {backupDue && (
          <p className="backup-reminder" role="note">
            {t.backupReminder}
          </p>
        )}
        <div className="backup-actions">
          <button className="secondary" onClick={exportData}>
            <Download size={16} />
            {t.exportJson}
          </button>
          <button className="secondary" disabled={importBusy} onClick={chooseImport}>
            <Upload size={16} />
            {t.importData}
          </button>
        </div>
        {!data.periods.length && <p className="backup-empty-hint">{t.backupEmpty}</p>}
        <p>{t.dataHint}</p>
        <button className="delete-btn" onClick={() => setModal("reset")}>
          <Trash2 size={14} />
          {t.deleteAll}
        </button>
      </div>
      <InstallPanel locale={locale} pwa={pwa} />
      <div className="app-version">
        <span>{t.appVersion}</span>
        <span>
          Luna <code>v{appVersion}</code>
        </span>
      </div>
    </Modal>
  );
}
