"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dateKey, parse, add, includesDate, projectionForDate, phaseAt } from "../lib/cycle";
import { phaseLabel } from "./cycle-chart";
import type { LunaController } from "../lib/use-luna";
export function PeriodCalendar({
  today,
  selected,
  setSelected,
  month,
  setMonth,
  t,
  effective,
  fmt,
  periods,
  next,
  limited,
  selectedPhase,
}: Pick<
  LunaController,
  | "today"
  | "selected"
  | "setSelected"
  | "month"
  | "setMonth"
  | "t"
  | "effective"
  | "fmt"
  | "periods"
  | "next"
  | "limited"
  | "selectedPhase"
>) {
  const first = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  return (
    <section className="card calendar-card">
      <div className="card-heading">
        <div>
          <span className="eyebrow">{t.yourCalendar}</span>
          <h2>{month.toLocaleDateString(t.locale, { month: "long", year: "numeric" })}</h2>
        </div>
        <div className="month-arrows">
          <button
            className="icon-btn"
            aria-label={t.previousMonth}
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="icon-btn"
            aria-label={t.nextMonth}
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="weekdays">
        {t.weekdays.map((s, i) => (
          <span key={i}>{s}</span>
        ))}
      </div>
      <div className="days">
        {Array.from({ length: first }, (_, i) => (
          <span key={"blank" + i} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const d = dateKey(new Date(month.getFullYear(), month.getMonth(), i + 1));
          const withinPeriod = periods.some((p) => includesDate(p, d, effective.periodLength));
          const state = phaseAt(
            projectionForDate(periods, d, effective.cycleLength, effective.periodLength, limited),
            d,
          );
          const logged = withinPeriod && d <= today;
          const predicted =
            !logged &&
            ((withinPeriod && d > today) ||
              (next && d >= next && d <= add(next, effective.periodLength - 1) && d >= today));
          return (
            <button
              key={d}
              aria-label={`${fmt(d, { month: "long", day: "numeric", year: "numeric" })}${logged ? `, ${t.period}` : predicted ? `, ${t.estimatedPeriod}` : ` · ${phaseLabel(t, state.phase)}`}`}
              aria-pressed={selected === d}
              className={`date calendar-phase-${state.phase} ${logged ? "logged" : ""} ${predicted ? "predicted" : ""} ${today === d ? "today" : ""} ${selected === d ? "selected" : ""}`}
              onClick={() => setSelected(d)}
            >
              <span>{i + 1}</span>
              {state.phase === "ovulation" && (
                <i className="calendar-ovulation" aria-hidden="true">
                  ✦
                </i>
              )}
            </button>
          );
        })}
      </div>
      <div className="legend">
        <span>
          <i className="legend-dot period-dot" />
          {t.period}
        </span>
        <span>
          <i className="legend-dot predicted-dot" />
          {t.estimated}
        </span>
        <span>
          <i className="legend-dot phase-fertile" />
          {t.chartFertile}
        </span>
        <span>
          <i className="legend-dot phase-ovulation" />
          {t.chartOvulation}
        </span>
      </div>
      <div className="calendar-bottom">
        <span>
          {selected === today ? t.today : fmt(selected)}{" "}
          <span className="muted">· {phaseLabel(t, selectedPhase.phase)}</span>
        </span>
        <button
          className="text-btn"
          onClick={() => {
            setSelected(today);
            setMonth(new Date(parse(today).getFullYear(), parse(today).getMonth(), 1));
          }}
        >
          {t.goToday}
        </button>
      </div>
    </section>
  );
}
