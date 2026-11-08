import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
const { version } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };
import { translations } from "../lib/i18n";
import type { LunaData } from "../lib/backup";
import { STORAGE_KEY } from "../lib/storage";
import { BACKUP_ACTIVITY_KEY } from "../lib/backup-reminder";

const vi = translations.vi;
const en = translations.en;
// Synthetic, historical fixtures only. Each test gets an isolated browser context.
const backup: LunaData = {
  version: 1,
  locale: "vi",
  trackingMode: "auto",
  cycleLength: 28,
  periodLength: 5,
  periods: [{ id: "fictional-period", start: "2025-01-01", end: null, autoEnd: true }],
  entries: {},
};
const stored = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), STORAGE_KEY);
async function settings(page: Page, label = vi.settings) {
  await page.getByRole("button", { name: label, exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
async function log(page: Page, start = "2025-01-01") {
  await page.getByRole("button", { name: vi.logPeriod, exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator('input[type="date"]')).toHaveCount(1);
  await dialog.getByLabel(vi.startDate).fill(start);
  await dialog.getByRole("button", { name: vi.savePeriod, exact: true }).click();
  await expect(dialog).toHaveCount(0);
}
async function upload(page: Page, text = JSON.stringify(backup)) {
  await page.locator('input[type="file"]').setInputFiles({
    name: "synthetic-luna.json",
    mimeType: "application/json",
    buffer: Buffer.from(text),
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: vi.settings, exact: true })).toBeVisible();
});

test("log a start, edit it, persist across reload, and delete", async ({ page }) => {
  await log(page);
  expect((await stored(page)).periods[0]).toMatchObject({
    start: "2025-01-01",
    end: "2025-01-05",
    autoEnd: true,
  });
  await page.getByRole("button", { name: vi.history, exact: true }).click();
  await page.getByRole("button", { name: new RegExp(`^${vi.edit}:`) }).click();
  await page.getByLabel(vi.startDate).fill("2025-01-03");
  await page.getByRole("button", { name: vi.savePeriod, exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: vi.history, exact: true }).click();
  await expect(page.locator(".history-row")).toHaveCount(1);
  expect((await stored(page)).periods[0].start).toBe("2025-01-03");
  await page.getByRole("button", { name: new RegExp(`^${vi.remove}:`) }).click();
  await expect(page.locator(".history-row")).toHaveCount(0);
  expect((await stored(page)).periods).toHaveLength(0);
});

test("preview restores without mutation until confirmation; export remains compatible", async ({
  page,
}) => {
  await log(page, "2025-02-01");
  const before = await stored(page);
  await settings(page);
  await upload(page);
  await expect(page.getByRole("button", { name: vi.importConfirm, exact: true })).toBeVisible();
  expect(await stored(page)).toEqual(before);
  await page.getByRole("button", { name: vi.importCancel, exact: true }).click();
  expect(await stored(page)).toEqual(before);
  await upload(page);
  await page.getByRole("button", { name: vi.importConfirm, exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await stored(page)).periods[0].start).toBe("2025-01-01");
  await settings(page);
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: vi.exportJson, exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(/^luna-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const exported = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(exported.format).toBe("luna-backup");
  expect(exported.backupVersion).toBe(1);
  expect(exported.data).toEqual(await stored(page));
  expect(exported.data).not.toHaveProperty(BACKUP_ACTIVITY_KEY);
});

test("invalid and overlapping imports leave existing records intact", async ({ page }) => {
  await log(page);
  const before = await stored(page);
  await settings(page);
  for (const text of [
    "{invalid",
    JSON.stringify({
      ...backup,
      periods: [backup.periods[0], { ...backup.periods[0], id: "duplicate" }],
    }),
  ]) {
    await upload(page, text);
    await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
    await expect(page.getByRole("button", { name: vi.importConfirm, exact: true })).toHaveCount(0);
    expect(await stored(page)).toEqual(before);
  }
});

test("both locales, persistent notice, and settings version", async ({ page }, testInfo) => {
  const notice = page.getByRole("note", { name: vi.estimateNoticeTitle });
  await expect(notice).toContainText(vi.estimateNoticeTitle);
  await expect(notice).toContainText(vi.estimateNoticeMessage);
  await expect(notice.getByRole("button")).toHaveCount(0);
  for (const tab of [vi.history, vi.calendar, vi.overview]) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    await expect(notice).toBeVisible();
  }
  await settings(page);
  await expect(page.getByText(`v${version}`, { exact: true })).toBeVisible();
  await page.getByLabel(vi.language).selectOption("en");
  await page.getByRole("button", { name: en.close, exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("note", { name: en.estimateNoticeTitle })).toContainText(
    en.estimateNoticeMessage,
  );
  await page.reload();
  await settings(page, en.settings);
  await expect(page.getByLabel(en.language)).toHaveValue("en");
  await page.getByLabel(en.language).selectOption("vi");
  await page.getByRole("button", { name: vi.close, exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath("overview.png"), fullPage: true });
});

test("uncertain days are explicit, and backup reminders follow export activity", async ({
  page,
}) => {
  await log(page);
  const reminder = page.getByRole("note").filter({ hasText: vi.backupReminderTitle });
  await expect(reminder).toBeVisible();
  await page.locator(".chart-cycle-selector select").selectOption("2025-01-01");
  await page
    .getByRole("group", { name: vi.chartDays })
    .getByRole("button", { name: /Ngày 22 của chu kỳ/ })
    .click();
  await expect(page.locator(".hero-day-status")).toContainText(vi.heroNotes.lower);
  await expect(page.locator(".phase-detail")).toContainText(vi.chartLower);
  const pending = page.waitForEvent("download");
  await reminder.getByRole("button", { name: vi.exportJson, exact: true }).click();
  await pending;
  await expect(reminder).toHaveCount(0);
  await page.reload();
  await expect(reminder).toHaveCount(0);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), BACKUP_ACTIVITY_KEY),
  ).not.toBeNull();
});

test("storage write failure does not replace in-memory records", async ({ page }) => {
  await log(page);
  const before = await stored(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Test quota", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: vi.history, exact: true }).click();
  await page.getByRole("button", { name: new RegExp(`^${vi.remove}:`) }).click();
  await expect(page.getByRole("alert")).toContainText(vi.saveError);
  await expect(page.locator(".history-row")).toHaveCount(1);
  expect(await stored(page)).toEqual(before);
});

test("production service worker reloads and edits records offline", async ({ page, context }) => {
  await log(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("note", { name: vi.estimateNoticeTitle })).toBeVisible();
  await page.getByRole("button", { name: vi.history, exact: true }).click();
  await expect(page.locator(".history-row")).toHaveCount(1);
  await page.getByRole("button", { name: new RegExp(`^${vi.edit}:`) }).click();
  await page.getByLabel(vi.startDate).fill("2025-01-02");
  await page.getByRole("button", { name: vi.savePeriod, exact: true }).click();
  expect((await stored(page)).periods[0].start).toBe("2025-01-02");
});
