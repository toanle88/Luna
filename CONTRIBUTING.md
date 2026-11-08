# Contributing to Luna

Thanks for helping improve Luna. Read the [Code of Conduct](CODE_OF_CONDUCT.md) before
participating. Search existing issues before proposing a change; discuss substantial behavior or
storage changes first.

## Set up

Follow the [README](README.md#quick-start). Install from the committed lockfile with
`pnpm install --frozen-lockfile`. Do not commit `node_modules`, build outputs, local credentials, or
real cycle histories.

## Git workflow

1. Fork the repository or create a focused branch from current `main`, such as
   `feat/calendar-navigation`, `fix/backup-validation`, or `docs/setup`.
2. Make one coherent change. Add a regression test for changed calculations or data handling; avoid
   tests that merely repeat implementation details.
3. Run `pnpm check` and `pnpm build`.
4. Update user/developer docs and the `Unreleased` section of [CHANGELOG.md](CHANGELOG.md) when
   relevant.
5. Open a pull request with a clear trigger, before/after behavior, validation, and compatibility
   notes.

Do not force-push `main` or rewrite a published release tag. Maintainers normally squash merge
reviewed pull requests.

## Commit and PR titles

Use `type(scope): description`, with an imperative, concrete description. Supported types are
`feat`, `fix`, `docs`, `test`, `refactor`, `style`, `build`, `ci`, `perf`, and `chore`.

Examples:

- `fix(backup): reject duplicate period starts`
- `feat(calendar): navigate to the selected cycle`
- `docs: explain offline installation`

Use `!` and explain a breaking change in the body when stored data, backup compatibility, or public
behavior changes incompatibly. Conventional titles are a documented review requirement; the current
CI does not lint every commit message.

## Tests and review

- Use fictional dates and synthetic records in tests, logs, screenshots, and issues.
- Test date boundaries, DST, leap years, missing history, and irregular/missing records when
  relevant.
- Cover backup validation and legacy compatibility before changing persistence.
- Update both Vietnamese and English strings together.
- For UI changes, check narrow and wide layouts, keyboard use, and both locales. Record any
  unavailable browser/device verification honestly.
- For PWA changes, use the production build and the
  [deployment checklist](docs/DEPLOYMENT.md#manual-pwa-check).

The test runner discovers every `tests/*.test.mjs` file. New test files are included automatically.

## Coding and dependencies

Follow [CODING_STANDARD.md](docs/CODING_STANDARD.md). `pnpm format` applies the pinned formatter;
`pnpm lint:fix` handles safe lint fixes. Commit lockfile changes with dependency changes. Do not
upgrade the beta framework, React integration, or lint plugins independently without checking their
peer compatibility.

Generated shadcn UI and upstream assets retain scoped exceptions and licenses. Avoid unrelated edits
to them.

## Reporting a vulnerability

Follow [SECURITY.md](SECURITY.md). Do not put exploit details or personal backup data in a public
issue.
