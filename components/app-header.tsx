"use client";
import Link from "next/link";
import { CalendarDays, History, Leaf, Settings2, Download } from "lucide-react";
import type { LunaController } from "../lib/use-luna";
import { Flower } from "./flower";
export function AppHeader({
  today,
  tab,
  setTab,
  setModal,
  pwa,
  t,
  selectDate,
  openSettings,
}: Pick<
  LunaController,
  "today" | "tab" | "setTab" | "setModal" | "pwa" | "t" | "selectDate" | "openSettings"
>) {
  return (
    <header className="header">
      <Link
        href="/"
        className="brand"
        aria-label={t.home}
        onClick={() => {
          setTab("Overview");
          selectDate(today);
        }}
      >
        <Flower />
        <span>
          luna<span className="brand-dot">.</span>
        </span>
      </Link>
      <nav aria-label={t.navigation}>
        {[
          { name: "Overview", label: t.overview, Icon: Leaf },
          { name: "Calendar", label: t.calendar, Icon: CalendarDays },
          { name: "History", label: t.history, Icon: History },
        ].map(({ name, label, Icon }) => (
          <button key={name} className={tab === name ? "active" : ""} onClick={() => setTab(name)}>
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
      <div className="header-right">
        <span className="device">
          <span />
          {t.justYou}
        </span>
        {!pwa.installed && (
          <button
            className="icon-btn install-header"
            title={t.install}
            aria-label={t.install}
            onClick={() => setModal("install")}
          >
            <Download size={18} />
          </button>
        )}
        <button
          className="icon-btn settings"
          title={t.settings}
          aria-label={t.settings}
          onClick={openSettings}
        >
          <Settings2 size={20} />
        </button>
      </div>
    </header>
  );
}
