"use client";
import { CalendarDays, Check, LockKeyhole, Sparkles } from "lucide-react";
import type { LunaController } from "../lib/use-luna";
import { Modal } from "./modal";
export function PeriodDialog({
  today,
  setModal,
  editing,
  start,
  setStart,
  error,
  t,
  effective,
  fmt,
  loggingEffective,
  calculatedEnd,
  logPeriod,
}: Pick<
  LunaController,
  | "today"
  | "setModal"
  | "editing"
  | "start"
  | "setStart"
  | "error"
  | "t"
  | "effective"
  | "fmt"
  | "loggingEffective"
  | "calculatedEnd"
  | "logPeriod"
>) {
  return (
    <Modal
      title={editing ? t.editPeriod : t.logPeriod}
      close={() => setModal(null)}
      closeLabel={t.close}
    >
      <p className="modal-intro">{t.formIntro}</p>
      <form onSubmit={logPeriod}>
        <label>
          {t.startDate}
          <input
            required
            type="date"
            value={start}
            max={today}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <div className="calculated-date">
          <CalendarDays size={18} />
          <div>
            <span>{t.estimatedEnd}</span>
            <output>
              {calculatedEnd
                ? fmt(calculatedEnd, {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </output>
          </div>
          <Sparkles size={15} />
        </div>
        <p className="subtle">
          {effective.mode === "auto"
            ? t.autoEndHelpAuto(loggingEffective.periodLength)
            : t.autoEndHelp(loggingEffective.periodLength)}
        </p>
        {error && (
          <p className="error" role="alert">
            {t[error]}
          </p>
        )}
        <div className="form-note">
          <LockKeyhole size={14} />
          {t.privacyNote}
        </div>
        <button className="primary full" type="submit">
          <Check size={17} />
          {t.savePeriod}
        </button>
      </form>
    </Modal>
  );
}
