"use client";
import { Check, Download, Smartphone, WifiOff } from "lucide-react";
import { translations, type Locale } from "../lib/i18n";
import type { usePwa } from "../lib/use-pwa";
export function InstallPanel({ locale, pwa }: { locale: Locale; pwa: ReturnType<typeof usePwa> }) {
  const t = translations[locale];
  const title =
    pwa.platform === "ios"
      ? t.installIos
      : pwa.platform === "android"
        ? t.installAndroid
        : t.installDesktop;
  const steps =
    pwa.platform === "ios"
      ? t.installIosSteps
      : pwa.platform === "android"
        ? t.installAndroidSteps
        : t.installDesktopSteps;
  return (
    <section className="install-panel">
      <div className="install-panel-heading">
        <span className="privacy-icon">
          <Smartphone size={20} />
        </span>
        <div>
          <h3>{pwa.installed ? t.installed : t.installTitle}</h3>
          <p>{pwa.installed ? t.installedText : t.installIntro}</p>
        </div>
      </div>
      {!pwa.installed && (
        <>
          <button type="button" className="secondary full" onClick={pwa.install}>
            <Download size={16} />
            {pwa.canPrompt ? t.install : t.installGuide}
          </button>
          {(pwa.guide || !pwa.canPrompt) && (
            <div className="install-guide">
              <h4>{title}</h4>
              <ol>
                {steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
      {pwa.installError && (
        <p className="subtle" role="status">
          {t.installRetry}
        </p>
      )}
      <div className={`offline-status ${pwa.offline}`} role="status">
        {pwa.offline === "ready" ? <Check size={14} /> : <WifiOff size={14} />}
        <span>
          {pwa.offline === "ready"
            ? t.offlineReady
            : pwa.offline === "preparing"
              ? t.offlinePreparing
              : t.offlineUnavailable}
        </span>
      </div>
      <p className="install-footnote">{t.offlineHint}</p>
    </section>
  );
}
