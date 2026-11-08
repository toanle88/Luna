"use client";
import { Droplet, Plus, Trash2, Pencil } from "lucide-react";
import { periodDays, periodEnd } from "../lib/cycle";
import type { LunaController } from "../lib/use-luna";
import { Flower } from "./flower";
export function PeriodHistory({
  data,
  t,
  effective,
  fmt,
  save,
  periods,
  openPeriod,
  editPeriod,
}: Pick<
  LunaController,
  "data" | "t" | "effective" | "fmt" | "save" | "periods" | "openPeriod" | "editPeriod"
>) {
  return (
    <section className="card history-card">
      <div className="card-heading">
        <div>
          <div className="eyebrow">{t.story}</div>
          <h2>{t.periodHistory}</h2>
        </div>
        <span className="soft-label">{t.entries(periods.length)}</span>
      </div>
      {periods.length ? (
        periods.map((p) => (
          <div className="history-row" key={p.id}>
            <span className="history-icon">
              <Droplet size={20} />
            </span>
            <div>
              <strong>
                {fmt(p.start, { month: "short", day: "numeric", year: "numeric" })} –{" "}
                {fmt(periodEnd(p, effective.periodLength), {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </strong>
              <p>
                {t.days(periodDays(p, effective.periodLength))}
                {p.autoEnd ? ` · ${t.autoLabel}` : ""}
              </p>
            </div>
            <button
              className="icon-btn"
              aria-label={`${t.edit}: ${fmt(p.start)}`}
              onClick={() => editPeriod(p)}
            >
              <Pencil size={17} />
            </button>
            <button
              className="icon-btn"
              aria-label={`${t.remove}: ${fmt(p.start)}`}
              onClick={() =>
                save(
                  { ...data, periods: data.periods.filter((x) => x.id !== p.id) },
                  t.removedPeriod,
                )
              }
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))
      ) : (
        <div className="empty">
          <Flower />
          <h2>{t.emptyTitle}</h2>
          <p>{t.emptyText}</p>
          <button className="primary" onClick={() => openPeriod()}>
            <Plus size={17} />
            {t.logFirst}
          </button>
        </div>
      )}
    </section>
  );
}
