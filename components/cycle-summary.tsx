"use client";
import { Download, ArrowUpRight, LockKeyhole, Sparkles } from "lucide-react";
import type { LunaController } from "../lib/use-luna";
import { Flower } from "./flower";
export function CycleSummary({
  t,
  effective,
  fmt,
  next,
  until,
  openSettings,
  backupDue,
  exportData,
}: Pick<
  LunaController,
  "t" | "effective" | "fmt" | "next" | "until" | "openSettings" | "backupDue" | "exportData"
>) {
  return (
    <div className="summary-grid">
      <aside className="side-stack">
        <section className="rhythm-card">
          <div className="eyebrow">
            <Sparkles size={13} />
            {t.lookingAhead}
          </div>
          <h2>
            {next ? (
              (until ?? 0) > 0 ? (
                <>
                  {t.nextInA}
                  <br />
                  <em>{t.nextInB(until!)}</em>
                </>
              ) : (
                <>
                  {t.expectedA}
                  <br />
                  <em>{t.expectedB}</em>
                </>
              )
            ) : (
              <>
                {t.momentsA}
                <br />
                <em>{t.momentsB}</em>
              </>
            )}
          </h2>
          <p>
            {next
              ? t.prediction(fmt(next, { month: "long", day: "numeric" }), effective.cycleLength)
              : t.personalCalendar}
          </p>
          <div className="rhythm-footer">{next ? t.estimateDisclaimer : t.noRush}</div>
          <Flower className="decor-flower" />
        </section>
        <section className="privacy-card">
          <span className="privacy-icon">
            <LockKeyhole size={20} />
          </span>
          <div>
            <h3>{t.yourData}</h3>
            <p>
              {t.browserOnly}
              <br />
              {t.noAccount}
            </p>
            {backupDue && (
              <div className="backup-reminder" role="note">
                <strong>{t.backupReminderTitle}</strong>
                <p>{t.backupReminder}</p>
                <button className="text-btn" onClick={exportData}>
                  <Download size={13} />
                  {t.exportJson}
                </button>
              </div>
            )}
            <button className="text-btn" onClick={openSettings}>
              {t.manageData}
              <ArrowUpRight size={13} />
            </button>
          </div>
        </section>
      </aside>
    </div>
  );
}
