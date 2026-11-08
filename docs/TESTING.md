# Testing

## Local commands

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm release:check
pnpm exec playwright install chromium
pnpm build
pnpm test:e2e
```

On Linux, `pnpm exec playwright install --with-deps chromium` also installs required system
libraries. `pnpm test:e2e:ui` opens the interactive runner. Build again after source changes:
browser tests use the production Worker, not the development server. Playwright starts and stops
Wrangler at `http://127.0.0.1:8787`; keep that port available. During local development an existing
server there can be reused; CI always starts a fresh process.

## Coverage

Node tests cover date boundaries, automatic learning, phase projections, legacy/invalid backups,
weekly reminder timing, service-worker cache rules, and version/release guards.

Playwright runs the same workflows in isolated desktop Chromium and Pixel 7 browser emulation:

- Start-date-only logging, calculated ends, editing, deletion, and reload persistence.
- Restore preview, cancellation, confirmation, invalid/duplicate input, and compatible JSON export.
- Both locales, the permanent informational notice, settings version, and narrow viewport overflow.
- Uncertain-day wording and backup reminder behavior after a download is started.
- Failed storage writes preserving records.
- A real service worker controlling a production page, followed by an offline reload and edit.

Fixtures use fictional historical dates. Never place personal cycle records or real backup files in
tests, screenshots, or failure reports. Reports and traces stay in ignored `playwright-report/` and
`test-results/`; CI retains failure artifacts for seven days.

## CI and remaining checks

CI checks formatting, lint, strict types, unit tests, documentation links, and release metadata on
Node 22 and 24. A separate build and browser job must pass the final **Quality gate**. Tagged
releases run the browser suite before publishing too.

Chromium device emulation does not verify physical Android/iOS installation, WebKit, assistive
technology, all browser storage policies, or medical accuracy. Use the
[manual PWA checklist](DEPLOYMENT.md#manual-pwa-check) on real devices. Medical UX review and
real-user validation remain follow-up work; no production-readiness or clinical certification is
implied by a passing suite.
