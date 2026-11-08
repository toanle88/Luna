# Luna

A simple period tracker with a soft cream and terracotta interface, Vietnamese and English locales, and browser-local data.

## Features

- Log a period with only its start date; the end date is estimated automatically.
- Automatic mode learns cycle length from recent history, with defaults of 28 cycle days and 5 period days when observations are missing. Manual mode is also available.
- Calendar, interactive cycle chart, and estimated period, fertility-window, and ovulation information.
- JSON backup and restore with validation and a preview before replacement.
- Installable PWA with an offline app shell.
- Data stays in localStorage. There is no shared database or required account for the tracker.

Fertility estimates are for reference only and must not be used as contraception. Automatically generated period ends are not treated as observed durations when learning from history.

## Run locally

Use Node.js 22.13.0 or later and pnpm 11.25.0.

```bash
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed in the terminal, normally `http://localhost:5173`.

## Production build and PWA

```bash
pnpm build
node scripts/generate-pwa.mjs
node scripts/validate-pwa.mjs
pnpm start
```

`pnpm start` serves the built Cloudflare Worker locally through Wrangler. Open the URL printed in the terminal. Run the PWA generation step after each build to refresh the offline asset list. Use HTTPS when hosting away from localhost.

## Checks

```bash
pnpm exec tsc --noEmit
node --test tests/cycle.test.mjs tests/backup.test.mjs tests/pwa.test.mjs
```

The source snapshot passed its production build and 45 tests. PWA installation has not been tested on a physical device.

## Source layout

| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Screens and interactions |
| `app/globals.css` | Interface styling |
| `lib/cycle.ts` | Cycle estimates, automatic/manual mode, and phase projection |
| `lib/i18n.ts` | Vietnamese and English strings |
| `lib/backup.ts` | JSON backup validation and restore |
| `components/cycle-chart.tsx` | Interactive cycle timeline |
| `lib/use-pwa.ts`, `public/sw.js` | PWA installation and offline support |
| `tests/` | Regression checks |

See [HUONG-DAN-CHAY.md](HUONG-DAN-CHAY.md) for Vietnamese setup instructions and [docs/STARTER-README.md](docs/STARTER-README.md) for the original Vinext starter documentation.

## Existing data and hosting

Your saved periods are in your browser, not in this repository. To move data to another browser or origin, export JSON from **Settings → Backup & restore**, then import it in the new instance.

`.openai/hosting.json` records the existing Sites project. Running this code locally does not publish changes to that site. This repository contains source and assets; it excludes dependency caches, generated builds, Git history from the Sites checkout, and session credentials.
