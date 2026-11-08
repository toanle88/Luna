import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
const { outputText } = ts.transpileModule(
  readFileSync(new URL("../lib/backup-reminder.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
);
const context = { exports: {} };
vm.createContext(context);
vm.runInContext(outputText, context);
const { backupIsDue } = context.exports;
const now = Date.parse("2026-11-08T12:00:00Z");
test("empty history needs no backup reminder", () => {
  assert.equal(backupIsDue(0, null, now), false);
});
test("records with missing, invalid, or implausibly future activity need a backup", () => {
  for (const last of [null, "invalid", "2027-01-01T00:00:00Z"])
    assert.equal(backupIsDue(1, last, now), true);
});
test("weekly reminder returns at seven days without modifying records", () => {
  assert.equal(backupIsDue(1, "2026-11-08T12:00:00Z", now), false);
  assert.equal(backupIsDue(1, "2026-11-01T12:00:01Z", now), false);
  assert.equal(backupIsDue(1, "2026-11-01T12:00:00Z", now), true);
  assert.equal(backupIsDue(1, "2026-10-01T12:00:00Z", now), true);
});
