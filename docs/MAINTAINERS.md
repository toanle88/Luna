# Maintainer setup

Repository files provide conventions and automation. They do **not** enable GitHub
account/repository settings. Configure these in GitHub after the first successful CI run.

## Protect `main`

In repository **Settings → Rules → Rulesets**, create a branch ruleset for the default branch:

- Require pull requests and resolved review conversations.
- Require the **Quality gate** status check from the `CI` workflow.
- Block force pushes and branch deletion; prefer linear history and squash merges.
- Require an independent approval when another trusted reviewer is available. A sole maintainer
  cannot approve their own PR; choose and document an appropriate bypass policy until the project
  has a second reviewer.
- Keep any administrator bypass narrow and auditable.

`.github/CODEOWNERS` identifies the maintainer, but code-owner approval is enforced only when the
corresponding repository rule is enabled. The GitHub connection used to prepare these files cannot
change administrative rules, so these settings must be applied separately.

## Pull requests and Actions

Enable squash merging and use the PR title as the squash commit title. Contributors should use
Conventional Commit titles. Review the PR template before merging.

Allow GitHub Actions to run the checked-in workflows. Keep the default token read-only; the release
publish job requests write access only when a verified version tag is pushed. Never switch
contributor CI to `pull_request_target` while executing untrusted PR code with write credentials.

Workflow actions are pinned to full commit SHAs verified against their upstream repositories.
Dependabot proposes weekly action updates. Review action/dependency changes rather than merging
blindly.

## Security and repository health

Enable dependency alerts, automated security updates where available, and private vulnerability
reporting under repository security settings. Check [SECURITY.md](../SECURITY.md) and respond
through a private channel when appropriate.

The pinned React lint plugin currently declares ESLint 9 peer compatibility rather than ESLint 10.
Coordinate the ESLint/Next/plugin upgrade instead of forcing incompatible peers. The application
also depends on a beta Vinext release; verify upgrades with production builds and real-browser
checks.

## Before declaring a release ready

Follow [RELEASING.md](RELEASING.md), confirm the latest CI result, and perform the
[manual PWA check](DEPLOYMENT.md#manual-pwa-check). Automated checks do not prove device
installation, accessibility, or clinical accuracy.
