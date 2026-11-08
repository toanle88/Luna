# Architecture

## Runtime

Luna uses React and TypeScript through the beta Vinext framework, Vite, and a Cloudflare Worker
entry point. The tracker itself uses browser APIs and localStorage rather than an account or remote
records database.

| Module                       | Responsibility                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `app/page.tsx`               | Screen state, calendar selection, logging, settings, and restore confirmation            |
| `lib/cycle.ts`               | Date helpers, automatic/manual values, normalized periods, and bounded phase projections |
| `lib/backup.ts`              | Backup envelope, validation, data preparation, and compatibility                         |
| `lib/i18n.ts`                | Vietnamese and English labels and messages                                               |
| `components/cycle-chart.tsx` | Day-by-day timeline and accessible phase details                                         |
| `lib/use-pwa.ts`             | Browser installation events and service-worker lifecycle                                 |
| `public/sw.js`               | Public app-shell caching and offline navigation fallback                                 |
| `scripts/generate-pwa.mjs`   | Precache list and version derived from built assets                                      |

## State and dates

The loading shell renders before browser-only hydration. The local date is derived in the browser.
Feature actions prepare and save a complete data snapshot only after validation; state updates only
after localStorage succeeds.

Dates use local calendar keys (`YYYY-MM-DD`) and UTC calendar components for day differences.
Noon-local parsing avoids midnight transitions. Tests cover DST, month/year boundaries, and leap
years.

Manual settings are retained separately from effective automatic values. History changes recompute
automatic estimates; generated end dates never become actual observations. Estimated ends are
bounded by a subsequently logged start. Actual recorded ends are preserved.

## Prediction boundaries

Cycle projections stop at their modeled end rather than repeating indefinitely across missed
periods. Incomplete or variable history can hide fertility statuses. Historical cycle lengths can
use a subsequent logged start. The display is a calendar estimate rather than evidence of ovulation
or contraceptive safety.

The calculation and its medical reference links are visible in the application's chart details.

## Storage, backup, and security

See [DATA_AND_PRIVACY.md](DATA_AND_PRIVACY.md) for formats and [SECURITY.md](../SECURITY.md) for
reporting. There is no analytics collection in the application code. Initial loads still make
ordinary host/asset requests and currently fetch external font CSS.

## Testing limits

Node tests exercise pure calculations, backup validation, simulated service-worker behavior, and
release guards. CI also checks types, lint, formatting, documentation links, and a production/PWA
build. DOM interactions, visual layout, accessibility with real assistive technology, and
physical-device installation require manual validation. Unit checks and file-presence checks do not
establish clinical accuracy or prove real offline installation.
