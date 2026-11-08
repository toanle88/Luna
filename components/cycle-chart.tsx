"use client";
import { CalendarDays, Droplet, Sparkles, Info, Plus } from "lucide-react";
import { add, formatDate, phaseAt, projectCycle, type Period, type CyclePhase } from "../lib/cycle";
import { translations, type Locale } from "../lib/i18n";
type Props = {
  periods: Period[];
  period?: Period;
  length: number;
  duration: number;
  limited: boolean;
  selected: string;
  today: string;
  locale: Locale;
  onSelect: (date: string) => void;
  onLog: () => void;
  onSettings: () => void;
};
export const phaseLabel = (t: typeof translations.en, phase: CyclePhase) =>
  ({
    period: t.chartPeriod,
    fertile: t.chartFertile,
    ovulation: t.chartOvulation,
    lower: t.chartLower,
    unknown: t.chartUnknown,
  })[phase];
export function CycleChart({
  periods,
  period,
  length,
  duration,
  limited,
  selected,
  today,
  locale,
  onSelect,
  onLog,
  onSettings,
}: Props) {
  const t = translations[locale];
  const fmt = (date: string, opts?: Intl.DateTimeFormatOptions) => formatDate(date, t.locale, opts);
  const next =
    period &&
    [...periods].sort((a, b) => a.start.localeCompare(b.start)).find((p) => p.start > period.start);
  const model = period ? projectCycle(period, length, duration, next?.start, limited) : null;
  const detail = phaseAt(model, selected);
  const note = {
    period: t.chartPeriodNote,
    fertile: t.chartFertileNote,
    ovulation: t.chartOvulationNote,
    lower: t.chartLowerNote,
    unknown: t.chartUnknownNote,
  }[detail.phase];
  const range = (a: string, b: string) => (a === b ? fmt(a) : `${fmt(a)} – ${fmt(b)}`);
  return (
    <section className="card phase-chart" aria-label={t.chartTitle}>
      <div className="chart-heading">
        <div>
          <div className="eyebrow">
            <Sparkles size={13} />
            {t.chartEyebrow}
          </div>
          <h2>{t.chartTitle}</h2>
          <p>{t.chartHint}</p>
        </div>
        {period && (
          <label className="chart-cycle-selector">
            <span>{t.chartRange}</span>
            <select
              aria-label={t.chartSelect}
              value={period.start}
              onChange={(e) => onSelect(e.target.value)}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.start}>
                  {fmt(p.start, { day: "numeric", month: "short", year: "numeric" })}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {!model ? (
        <div className="chart-empty">
          <span>
            <CalendarDays size={30} strokeWidth={1.2} />
          </span>
          <h3>{t.chartEmpty}</h3>
          <p>{t.chartEmptyText}</p>
          <button className="primary" onClick={onLog}>
            <Plus size={16} />
            {t.logFirst}
          </button>
        </div>
      ) : (
        <>
          <div className="chart-range-line">
            <span>
              {range(model.start, model.end)}{" "}
              <span className="chart-duration">· {t.days(model.length)}</span>
            </span>
            <span className="chart-estimate-badge">{t.chartEstimated}</span>
          </div>
          <div className="phase-summary">
            <div className="summary-period">
              <span>
                <Droplet size={14} />
                {t.chartPeriod}
              </span>
              <strong>{range(model.start, model.periodEnd)}</strong>
            </div>
            <div className="summary-fertile">
              <span>
                <Sparkles size={14} />
                {t.chartFertile}
              </span>
              <strong>
                {model.fertileStart && model.fertileEnd
                  ? range(model.fertileStart, model.fertileEnd)
                  : "—"}
              </strong>
            </div>
            <div className="summary-ovulation">
              <span>
                <span className="ovulation-symbol">✦</span>
                {t.chartOvulation}
              </span>
              <strong>
                {model.ovulationDate
                  ? fmt(model.ovulationDate, { day: "numeric", month: "long" })
                  : "—"}
              </strong>
            </div>
          </div>
          {!model.available && (
            <p className="chart-limited">
              <Info size={15} />
              <span>{t.chartLimited}</span>
            </p>
          )}
          <div className="phase-grid" role="group" aria-label={t.chartDays}>
            {Array.from({ length: model.length }, (_, i) => {
              const date = add(model.start, i);
              const state = phaseAt(model, date);
              const overlap = state.menstruating && state.phase !== "period";
              const label = `${fmt(date, { weekday: "long", day: "numeric", month: "long" })} · ${t.chartDay(i + 1)} · ${phaseLabel(t, state.phase)}${overlap ? ` · ${t.chartAlsoPeriod}` : ""}`;
              return (
                <button
                  key={date}
                  className={`phase-cell phase-${state.phase} ${date === selected ? "is-selected" : ""} ${date === today ? "is-today" : ""}`}
                  aria-label={label}
                  title={label}
                  aria-pressed={date === selected}
                  onClick={() => onSelect(date)}
                >
                  <span className="phase-day">{i + 1}</span>
                  <span className="phase-cell-date">
                    {fmt(date, { day: "numeric", month: "numeric" })}
                  </span>
                  {state.phase === "ovulation" && (
                    <span className="cell-symbol" aria-hidden="true">
                      ✦
                    </span>
                  )}
                  {overlap && <i className="period-overlap" aria-hidden="true" />}
                  {date === today && <i className="cell-today" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div className="phase-legend">
            {(["period", "fertile", "ovulation", "lower"] as CyclePhase[]).map((phase) => (
              <span key={phase}>
                <i className={`phase-key phase-${phase}`} />
                {phaseLabel(t, phase)}
              </span>
            ))}
            <span>
              <i className="today-key" />
              {t.today}
            </span>
          </div>
          <div className={`phase-detail detail-${detail.phase}`} aria-live="polite">
            <span className="detail-icon">
              {detail.phase === "period" ? (
                <Droplet size={22} />
              ) : detail.phase === "unknown" ? (
                <CalendarDays size={22} />
              ) : (
                <Sparkles size={22} />
              )}
            </span>
            <div>
              <span className="eyebrow">
                {t.chartSelected} ·{" "}
                {fmt(selected, { day: "numeric", month: "long", year: "numeric" })}
                {detail.day ? ` · ${t.chartDay(detail.day)}` : ""}
              </span>
              <h3>{phaseLabel(t, detail.phase)}</h3>
              <p>{note}</p>
              {detail.menstruating && detail.phase !== "period" && (
                <span className="overlap-label">
                  <Droplet size={11} />
                  {t.chartAlsoPeriod}
                </span>
              )}
            </div>
          </div>
        </>
      )}
      <div className="chart-safety">
        <Info size={16} />
        <p>
          <strong>{t.chartSafety}</strong> {t.chartSafetyDetail}
        </p>
      </div>
      <div className="chart-bottom">
        <details>
          <summary>{t.chartMethod}</summary>
          <p>{t.chartMethodText}</p>
          <span>
            {t.chartSources}:{" "}
            <a
              href="https://www.acog.org/womens-health/experts-and-stories/the-latest/trying-to-get-pregnant-heres-when-to-have-sex"
              target="_blank"
              rel="noreferrer"
            >
              ACOG
            </a>{" "}
            ·{" "}
            <a
              href="https://www.cdc.gov/contraception/hcp/usspr/standard-days-method.html"
              target="_blank"
              rel="noreferrer"
            >
              CDC
            </a>
          </span>
        </details>
        <button className="text-btn" onClick={onSettings}>
          {t.chartSettings}
        </button>
      </div>
    </section>
  );
}
