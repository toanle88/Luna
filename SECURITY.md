# Security policy

## Supported versions

| Version         | Status                        |
| --------------- | ----------------------------- |
| Latest `0.1.x`  | Best-effort fixes             |
| Older snapshots | Upgrade to the latest release |

This is an early open-source project without a guaranteed response time or security certification.

## Report privately

Use
[GitHub private vulnerability reporting](https://github.com/toanle88/Luna/security/advisories/new)
when enabled. Describe the affected version, impact, minimal reproduction with synthetic data, and a
suggested fix if available.

If private reporting is unavailable, open an issue titled “Private security contact requested”
without vulnerability details or personal information, and wait for a maintainer to arrange a
private channel. Do not share real cycle histories, backup files, tokens, or credentials publicly.

## Security boundaries

Cycle records are stored in localStorage, not in an authenticated backend. They are not encrypted by
Luna and can be read by scripts running on the same origin or by someone with access to the browser
profile. A downloaded JSON backup is also plaintext.

The service worker caches public app-shell resources, not private records. Imported JSON is parsed,
validated, and previewed before confirmation. Files are read on the device rather than uploaded to
an API. These controls do not replace browser/host security or careful handling of exported files.

See [data and privacy](docs/DATA_AND_PRIVACY.md) for external font requests, local origins, and
migration details.

## Dependency maintenance

Dependabot proposes weekly package and GitHub Actions updates. The package lockfile, install policy,
pinned action revisions, and CI checks support review; they are not a guarantee that dependencies
are free of vulnerabilities. Maintainers should enable dependency alerts and private reporting as
described in [maintainer settings](docs/MAINTAINERS.md).
