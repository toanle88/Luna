"use client";
import { type CSSProperties } from "react";
import { ArrowRight, CalendarDays, Droplet, Sparkles } from "lucide-react";
import { periodDays } from "../lib/cycle";
import type { LunaController } from "../lib/use-luna";
export function CycleOverview({
  today,
  selected,
  t,
  effective,
  fmt,
  last,
  next,
  selectedModel,
  selectedPhase,
  openPeriod,
}: Pick<
  LunaController,
  | "today"
  | "selected"
  | "t"
  | "effective"
  | "fmt"
  | "last"
  | "next"
  | "selectedModel"
  | "selectedPhase"
  | "openPeriod"
>) {
  return (
    <section className={`cycle-card hero-phase-${selectedPhase.phase}`}>
      <div className="cycle-top">
        <span className="eyebrow">{t.atGlance}</span>
        <span className="pill">
          <span />
          {t.heroBadges[selectedPhase.phase]}
        </span>
      </div>
      <div className="cycle-content">
        <div
          className={`cycle-ring ${selectedPhase.day !== null ? "has-data" : ""}`}
          style={
            {
              "--progress": `${selectedPhase.day && selectedModel ? Math.min(selectedPhase.day / selectedModel.length, 1) * 100 : 0}%`,
            } as CSSProperties
          }
        >
          <div className="ring-inner">
            <span className="ring-label">{t.cycleDay}</span>
            <strong>{selectedPhase.day ?? "—"}</strong>
            <span className="ring-sub">
              {selectedModel ? t.ofDays(selectedModel.length) : t.chartUnknown}
            </span>
          </div>
          <span className="ring-spark">✦</span>
        </div>
        <div className="cycle-description hero-day-status" aria-live="polite">
          <span className="small-label">
            {selected === today ? t.today : fmt(selected, { day: "numeric", month: "short" })} ·{" "}
            {t.chartEstimated}
          </span>
          <h2>{t.heroPhases[selectedPhase.phase]}</h2>
          <p>{t.heroNotes[selectedPhase.phase]}</p>
          {selectedPhase.menstruating && selectedPhase.phase !== "period" && (
            <span className="hero-overlap">
              <Droplet size={11} />
              {t.chartAlsoPeriod}
            </span>
          )}
          <button className="cycle-link" onClick={() => openPeriod()}>
            {last ? t.addPeriod : t.getStarted}
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
      <div className="cycle-stats">
        <div>
          <Droplet size={17} />
          <span>
            {t.days(last ? periodDays(last, effective.periodLength) : "—")}
            <small>{t.lastPeriod}</small>
          </span>
        </div>
        <div>
          <CalendarDays size={17} />
          <span>
            {next ? fmt(next) : t.notYet}
            <small>{t.nextPeriod}</small>
          </span>
        </div>
        <div>
          <Sparkles size={17} />
          <span>
            {t.days(effective.cycleLength)}
            <small>{t.cycleLengthLabel}</small>
          </span>
        </div>
      </div>
    </section>
  );
}
