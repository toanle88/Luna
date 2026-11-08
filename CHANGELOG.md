# Changelog

Changes are grouped by release. This project follows Semantic Versioning for stable tags and uses an
`Unreleased` section for work awaiting release. A version entry does not mean its tag has already
been published; see [GitHub Releases](https://github.com/toanle88/Luna/releases).

## [Unreleased]

## [0.1.2] - 2026-11-08

### Fixed

- Replace the overview tagline with a compact, permanent Vietnamese/English notice explaining that
  cycle and fertile-day estimates must not be used as contraception. Keep it above the content in
  every main-page view, with an information icon and readable contrast.

## [0.1.1] - 2026-11-08

### Fixed

- Show the application version in Settings in Vietnamese and English, sourced directly from package
  metadata so the displayed value stays aligned with future version bumps.

## [0.1.0] - 2026-11-08

### Added

- Browser-local period tracking using only the start date.
- Automatic and manual cycle estimation with explicit history/default sources.
- Vietnamese and English interfaces, cycle timeline, and calendar phase estimates.
- PWA installation guidance and offline app-shell support.
- Validated JSON backup import/export with restore preview.
- Contribution, architecture, privacy, security, coding, deployment, and release documentation.
- Formatting, lint, type, test, documentation-link, production-build, and release checks.
- GitHub Actions CI for Node 22/24, a gated tag-release workflow, and Dependabot updates.

### Changed

- Established `0.1.0` as the package/release version. Earlier “v7” referred to the original hosted
  source snapshot, not a Semantic Versioning release.
- Formatted maintained source and addressed existing lint findings.
- Integrated PWA asset generation and validation into `pnpm build`.
