# Build and deployment

## Build locally

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm start
```

`pnpm build` runs the Vinext production build, generates a content-derived precache list in
`dist/client/sw.js`, and validates required assets, manifest/icons, and service-worker headers.

The Worker entry point is `dist/server/index.js`; public assets are in `dist/client`. `pnpm start`
runs the built Worker locally using the emitted Wrangler configuration. Dependency caches and
generated outputs are not committed.

## Hosting

The app needs a Cloudflare Workers-compatible runtime for this build configuration. Follow the
target host's current deployment instructions for the Worker and asset outputs. HTTPS is required
away from localhost for service-worker functionality.

`.openai/hosting.json` records the existing Sites project and its optional bindings. The original
Sites publication remains managed separately. Pushing this repository, running CI, or publishing a
GitHub release does not automatically update the hosted app. Do not reuse the original project
identity when creating an unrelated deployment.

No cycle-record database, connector binding, or application secret is required for the tracker.
Unused starter integrations have been removed; the Sites hosting integration remains.

## Manual PWA check

Use a production build on localhost or HTTPS:

1. Open the app online and wait for offline readiness in the installation panel.
2. Verify the manifest and service worker in browser developer tools.
3. Install from a supported browser, or follow the in-app iPhone instructions.
4. Close and reopen the installed app; verify the name, icon, and standalone display.
5. Record a synthetic start date, switch offline, reload, and confirm the calendar and records still
   work.
6. Return online, deploy a changed asset, reopen/reload, and confirm the new worker eventually
   replaces the prior cache.
7. Export a synthetic backup, import it into another browser/origin, inspect the preview, and verify
   replacement only after confirmation.

Also check keyboard focus, mobile layout, both locales, and storage-denied/full behavior. Automated
Chromium tests cover offline reloads and core workflows, but do not replace these device checks.
