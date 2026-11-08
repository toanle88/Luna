# Luna

[![CI](https://github.com/toanle88/Luna/actions/workflows/ci.yml/badge.svg)](https://github.com/toanle88/Luna/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A period tracker with Vietnamese and English interfaces, browser-local records, cycle estimates,
JSON backups, and an installable PWA.

**Cycle and fertility dates are estimates. Luna does not confirm ovulation and must not be used as
contraception.**

## Features

- Log a period using only its start date; estimate the end automatically.
- Choose automatic estimates from history or save your own manual cycle settings.
- Inspect a calendar and interactive cycle chart with estimated phases.
- Export JSON backups and preview validated data before restoring it.
- Get a quiet weekly backup reminder when records have no recent export or restore activity.
- Install the app and use its cached shell offline after an online visit.
- Keep cycle records in this browser's localStorage, without an account or shared database.

## Quick start

Prerequisites: Node.js **22.13+ within the 22.x line, or 24.x**, and **pnpm 11.25.0**. CI checks
both Node lines.

```bash
git clone https://github.com/toanle88/Luna.git
cd Luna
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed in the terminal, normally `http://localhost:5173`. On systems with nvm,
`nvm use` selects Node 22.

For Vietnamese instructions, see [Hướng dẫn chạy](HUONG-DAN-CHAY.md).

## Development commands

| Command              | Purpose                                                                |
| -------------------- | ---------------------------------------------------------------------- |
| `pnpm dev`           | Development server                                                     |
| `pnpm format`        | Format maintained source and docs                                      |
| `pnpm format:check`  | Check formatting without changing files                                |
| `pnpm lint`          | ESLint with zero warnings allowed                                      |
| `pnpm typecheck`     | Strict TypeScript checks                                               |
| `pnpm test`          | Discover and run Node test files                                       |
| `pnpm test:e2e`      | Browser workflows against a production build (desktop/mobile Chromium) |
| `pnpm test:e2e:ui`   | Open the interactive Playwright test runner                            |
| `pnpm test:watch`    | Rerun tests while editing                                              |
| `pnpm docs:check`    | Check local Markdown links                                             |
| `pnpm check`         | Formatting, lint, types, tests, and documentation                      |
| `pnpm build`         | Production build, offline asset generation, and PWA validation         |
| `pnpm start`         | Serve the production Worker locally through Wrangler                   |
| `pnpm release:check` | Validate the current version and dated changelog entry                 |

## Production and PWA

```bash
pnpm build
pnpm start
```

The build includes offline asset generation; no separate PWA post-build command is needed. Use the
local URL printed by Wrangler. For another hosting provider, use a Cloudflare Workers-compatible
deployment and HTTPS. The app shell caches only public resources; personal records remain in
localStorage.

See [deployment](docs/DEPLOYMENT.md) for build outputs, existing Sites configuration, and a manual
PWA checklist. This repository does not automatically deploy the hosted application.

## Data and estimates

Automatic mode is the default. It averages up to six recent valid start-to-start intervals. When no
usable interval exists, it uses 28 days. Period duration uses only explicitly recorded actual
observations, falling back to 5 days when none exist. Generated end dates do not train future
duration estimates. The normal logging form still needs only a start date.

Records are specific to the browser and origin. Clearing browser storage removes them. To move
records, use **Settings → Backup & restore → Export JSON**, then import the file in the new
instance. Imports replace existing records only after an explicit confirmation. Backups are
unencrypted JSON; store them privately and check that the downloaded file is retained.

See [data and privacy](docs/DATA_AND_PRIVACY.md) for schema compatibility, backup handling, network
requests, and the limits of local storage.

## Contributing

Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the [coding standard](docs/CODING_STANDARD.md).
Use a focused branch and pull request with a Conventional Commit-style title. CI runs on pull
requests and pushes to `main`.

- [Architecture](docs/ARCHITECTURE.md)
- [Release process](docs/RELEASING.md)
- [Maintainer settings](docs/MAINTAINERS.md)
- [Security policy](SECURITY.md)
- [Community conduct](CODE_OF_CONDUCT.md)
- [Changelog](CHANGELOG.md)

## Project status

Luna is an early **0.x** open-source application using React, TypeScript, and the beta Vinext
framework. Its automated suite covers date calculations, estimation, backup validation,
service-worker behavior, release guards, and browser workflows on desktop and emulated mobile
Chromium. Physical-device installation, assistive-technology checks, and real-world validation
remain manual; passing CI is not clinical validation.

For browser tests, run `pnpm exec playwright install chromium`, then `pnpm build` and
`pnpm test:e2e`. Linux hosts may also need `pnpm exec playwright install --with-deps chromium`. See
[testing](docs/TESTING.md) for coverage and limitations.

## License

[MIT](LICENSE), copyright Toan Le. See [third-party notices](THIRD_PARTY_NOTICES.md) for retained
upstream components and licenses.
