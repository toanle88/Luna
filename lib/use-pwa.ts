"use client";
import { useEffect, useState } from "react";
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
export function usePwa() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [offline, setOffline] = useState<"preparing" | "ready" | "unavailable">("preparing");
  const [guide, setGuide] = useState(false);
  const [installError, setInstallError] = useState(false);
  // Initial install state comes from browser-only platform APIs after SSR.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const check = () =>
      setInstalled(
        media.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone,
      );
    check();
    media.addEventListener("change", check);
    const capture = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", done);
    const ua = navigator.userAgent;
    setPlatform(
      /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
        ? "ios"
        : /Android/.test(ua)
          ? "android"
          : "desktop",
    );
    let alive = true;
    const register = async () => {
      if (!("serviceWorker" in navigator)) {
        if (alive) setOffline("unavailable");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
        if (!alive) return;
        if (reg.active) setOffline("ready");
        const track = () => {
          const worker = reg.installing || reg.waiting;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (!alive) return;
            if (worker.state === "activated") setOffline("ready");
            if (worker.state === "redundant" && !reg.active) setOffline("unavailable");
          });
        };
        track();
        reg.addEventListener("updatefound", track);
        navigator.serviceWorker.ready.then(() => {
          if (alive) setOffline("ready");
        });
      } catch {
        if (alive) setOffline("unavailable");
      }
    };
    register();
    return () => {
      alive = false;
      media.removeEventListener("change", check);
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  async function install() {
    if (!prompt) {
      setGuide(true);
      return;
    }
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      setInstallError(true);
      setGuide(true);
    } finally {
      setPrompt(null);
    }
  }
  return { installed, canPrompt: !!prompt, platform, offline, guide, installError, install };
}
