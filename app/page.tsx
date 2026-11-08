"use client";
import { Check, Droplet, Heart, Plus, Settings2, Info } from "lucide-react";
import { periodEnd } from "../lib/cycle";
import { CycleChart } from "../components/cycle-chart";
import { useLuna } from "../lib/use-luna";
import { Flower } from "../components/flower";
import { AppHeader } from "../components/app-header";
import { CycleOverview } from "../components/cycle-overview";
import { PeriodCalendar } from "../components/period-calendar";
import { CycleSummary } from "../components/cycle-summary";
import { PeriodHistory } from "../components/period-history";
import { PeriodDialog } from "../components/period-dialog";
import { SettingsDialog } from "../components/settings-dialog";
import { ResetDialog } from "../components/reset-dialog";
import { ImportDialog } from "../components/import-dialog";
import { InstallDialog } from "../components/install-dialog";
export default function Home() {
  const luna = useLuna();
  const {
    ready,
    storageError,
    today,
    selected,
    tab,
    modal,
    toast,
    locale,
    t,
    effective,
    fmt,
    periods,
    current,
    limited,
    chartPeriod,
    selectDate,
    openSettings,
    openPeriod,
  } = luna;
  if (!ready)
    return (
      <div className="loading">
        <Flower />
        <p>{t.opening}</p>
      </div>
    );
  return (
    <div className={`app locale-${locale}`}>
      <AppHeader {...luna} />
      <main>
        <aside className="estimate-notice" role="note" aria-labelledby="estimate-notice-title">
          <Info size={18} strokeWidth={1.75} aria-hidden="true" focusable="false" />
          <div>
            <strong id="estimate-notice-title" className="estimate-notice-title">
              {t.estimateNoticeTitle}
            </strong>
            <p className="estimate-notice-message">{t.estimateNoticeMessage}</p>
          </div>
        </aside>
        {storageError && (
          <div className="error" role="alert">
            {t[storageError]}
          </div>
        )}
        <div className={`page-heading ${tab === "Overview" ? "page-toolbar" : ""}`}>
          <div>
            <div className="eyebrow heading-date">
              <span className="tiny-star">✦</span>
              {fmt(today, { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <h1 className={tab === "Overview" ? "sr-only" : undefined}>
              {tab === "Overview" ? (
                t.overview
              ) : tab === "Calendar" ? (
                <>
                  {t.calendarA} <em>{t.calendarB}</em>
                </>
              ) : (
                <>
                  {t.historyA} <em>{t.historyB}</em>
                </>
              )}
            </h1>
            {tab !== "Overview" && <p>{tab === "History" ? t.historySubtitle : t.subtitle}</p>}
          </div>
          <button className="primary" onClick={() => openPeriod()}>
            <Plus size={18} />
            {t.logPeriod}
          </button>
        </div>
        {current?.autoEnd && (
          <section className="ongoing-banner">
            <div>
              <Droplet size={18} />
              <span>
                <strong>{t.currentEstimate}</strong>
                <small>
                  {t.currentEstimateText(fmt(periodEnd(current, effective.periodLength)))}
                </small>
              </span>
            </div>
            <button className="secondary" onClick={openSettings}>
              {t.adjust}
              <Settings2 size={15} />
            </button>
          </section>
        )}
        {tab !== "History" ? (
          <>
            <div className={`top-grid ${tab === "Calendar" ? "calendar-view" : ""}`}>
              {tab === "Overview" && <CycleOverview {...luna} />}
              <PeriodCalendar {...luna} />
            </div>
            <CycleChart
              periods={periods}
              period={chartPeriod}
              length={effective.cycleLength}
              duration={effective.periodLength}
              limited={limited}
              selected={selected}
              today={today}
              locale={locale}
              onSelect={selectDate}
              onLog={() => openPeriod()}
              onSettings={openSettings}
            />
            <CycleSummary {...luna} />
          </>
        ) : (
          <PeriodHistory {...luna} />
        )}
        <footer>
          <span className="footer-brand">
            <Flower />
            {t.footer}
          </span>
          <span>
            {t.madeForYou}
            <Heart size={12} />
          </span>
        </footer>
      </main>
      {toast && (
        <div role="status" className="toast">
          <Check size={17} />
          {toast}
        </div>
      )}
      {modal === "period" && <PeriodDialog {...luna} />}
      {modal === "settings" && <SettingsDialog {...luna} />}
      {modal === "reset" && <ResetDialog {...luna} />}
      {modal === "import" && <ImportDialog {...luna} />}
      {modal === "install" && <InstallDialog {...luna} />}
    </div>
  );
}
