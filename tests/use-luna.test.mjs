import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

const require = createRequire(import.meta.url);
const today = "2026-11-25";
// Exercise the real controller with isolated hooks/storage and fictional dates.
// Effects other than initial hydration are irrelevant to these save regressions.
function controller({ failWrite = false, periodLength = 5, persisted } = {}) {
  const states = [];
  const effects = [];
  let cursor = 0;
  const modules = new Map();
  const storage = new Map();
  const old = { id: "old", start: "2026-11-01", end: null };
  class FixedDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [2026, 10, 25, 12]));
    }
  }
  function load(file) {
    if (modules.has(file)) return modules.get(file);
    const { outputText } = ts.transpileModule(
      readFileSync(new URL(file, import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
        },
      },
    );
    const context = {
      exports: {},
      Date: FixedDate,
      crypto: { randomUUID: () => "new" },
      localStorage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => {
          if (failWrite) throw new Error("Synthetic quota error");
          storage.set(key, value);
        },
      },
      require: (name) => {
        if (name === "react" && file.endsWith("use-luna.ts"))
          return {
            useState: (initial) => {
              const i = cursor++;
              if (!(i in states)) states[i] = typeof initial === "function" ? initial() : initial;
              return [
                states[i],
                (next) => (states[i] = typeof next === "function" ? next(states[i]) : next),
              ];
            },
            useEffect: (effect) => effects.push(effect),
          };
        if (name.endsWith("use-pwa")) return { usePwa: () => ({}) };
        if (name === "./use-backup") return { useBackup: () => ({}) };
        if (name.startsWith(".")) return load(`../lib/${name.split("/").at(-1)}.ts`);
        return require(name);
      },
    };
    vm.createContext(context);
    vm.runInContext(outputText, context);
    modules.set(file, context.exports);
    return context.exports;
  }
  const { STORAGE_KEY } = load("../lib/storage.ts");
  storage.set(
    STORAGE_KEY,
    JSON.stringify(
      persisted ?? {
        version: 1,
        locale: "vi",
        trackingMode: "manual",
        cycleLength: 25,
        periodLength,
        periods: [old],
        entries: {},
      },
    ),
  );
  const { useLuna } = load("../lib/use-luna.ts");
  const render = function TestController() {
    cursor = 0;
    return useLuna();
  };
  render();
  effects[0]();
  return {
    render,
    read: () => JSON.parse(storage.get(STORAGE_KEY)),
    overview: (value) =>
      renderToStaticMarkup(
        createElement(load("../components/cycle-overview.tsx").CycleOverview, value),
      ),
  };
}

function saveEarlyPeriod(app) {
  app.render().selectDate("2026-11-02");
  assert.equal(app.render().selectedPhase.day, 2);
  app.render().openPeriod("2026-11-23");
  app.render().logPeriod({ preventDefault() {} });
  return app.render();
}

test("saving an early new period replaces a selected old cycle immediately and after hydration", () => {
  for (const periodLength of [5, 31]) {
    const app = controller({ periodLength });
    const state = saveEarlyPeriod(app);
    assert.equal(state.modal, null);
    assert.equal(state.selected, today);
    assert.equal(state.month.getMonth(), 10);
    assert.equal(state.last.start, "2026-11-23");
    assert.equal(state.chartPeriod.start, "2026-11-23");
    assert.equal(state.selectedModel.start, "2026-11-23");
    assert.equal(state.selectedPhase.day, 3);
    assert.equal(state.next, "2026-12-18");
    assert.equal(app.read().periods.length, 2);
    // Rehydrate the actual serialized data through the controller's normal path.
    const hydrated = controller({ persisted: app.read() });
    assert.equal(hydrated.render().selectedModel.start, "2026-11-23");
    assert.equal(hydrated.render().selectedPhase.day, 3);
  }
});

test("failed saves keep the selected day, previous cycle, and open dialog", () => {
  const app = controller({ failWrite: true });
  const state = saveEarlyPeriod(app);
  assert.equal(state.selected, "2026-11-02");
  assert.equal(state.selectedModel.start, "2026-11-01");
  assert.equal(state.modal, "period");
  assert.equal(state.storageError, "saveError");
  assert.equal(app.read().periods.length, 1);
});

test("overview distinguishes logged starts from future estimates in both locales", () => {
  const app = controller();
  saveEarlyPeriod(app);
  for (const locale of ["vi", "en"]) {
    app.render().save({ ...app.read(), locale });
    const logged = app.render();
    const html = app.overview(logged);
    assert.ok(html.includes(logged.t.heroLoggedPeriod));
    assert.ok(html.includes(logged.t.heroLoggedNote));
    assert.ok(html.includes(logged.t.heroLoggedStart(logged.fmt("2026-11-23"))));
    app.render().selectDate("2026-11-26");
    const future = app.render();
    const estimate = app.overview(future);
    assert.ok(estimate.includes(future.t.heroPhases.period));
    assert.ok(estimate.includes(future.t.chartEstimated));
    assert.ok(!estimate.includes(future.t.heroLoggedPeriod));
    app.render().selectDate(today);
  }
});
