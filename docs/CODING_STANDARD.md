# Coding standard

## Automated baseline

TypeScript is strict. ESLint's Next/TypeScript and React Hooks configurations check maintained code,
with zero warnings allowed. Prettier is pinned exactly in `package.json`; `.prettierrc.json` owns
formatting. `.editorconfig` and `.gitattributes` keep UTF-8 and LF endings consistent across editors
and operating systems.

Run `pnpm check` before a pull request. Run `pnpm format` and `pnpm lint:fix` to apply safe fixes.
CI repeats the checks from a frozen lockfile.

## Implementation rules

- Prefer pure functions in `lib/` for date arithmetic, estimates, and validation. Keep browser
  operations in client boundaries.
- Use `type` imports for TypeScript-only dependencies. Avoid `any`, implicit truthiness for unknown
  data, and unchecked casts at external boundaries.
- Validate imported or persisted data before using it. Preserve backward compatibility or document a
  versioned migration.
- Keep errors actionable and distinguish observed facts from estimates.
- Use calendar-date helpers for day calculations. Do not replace them with millisecond arithmetic
  that breaks across DST.
- Keep labels, accessible names, and errors in the shared locale dictionaries; update Vietnamese and
  English together.
- Use semantic controls, accessible names, visible focus, and keyboard-operable interactions. Pair
  phase colors with text.
- Keep changes focused; do not add dependencies for behavior that platform APIs cover clearly.

## Narrow exceptions

Client bootstrap effects synchronize browser-only records, optional backup activity, and PWA
capabilities after server rendering. Their `react-hooks/set-state-in-effect` exceptions are scoped
and explained in source. Do not spread those exceptions to ordinary derived state or use timers
merely to bypass a lint rule.

Ambient declaration files allow inline `import()` type references so virtual-module and global
declarations remain global scripts. Ordinary TypeScript files require type imports.

Prettier excludes the licensed Sites integration, lockfile, and build/runtime/test output. Those
exclusions do not apply to Luna's feature components or business logic.

## Dependencies and generated files

Use pnpm 11.25.0 and commit `pnpm-lock.yaml`. Review peer compatibility when upgrading ESLint/Next
configuration, TypeScript, React, Vinext, and Vite. The current framework-compatible ESLint 9 line
is retained because the pinned React lint plugin does not yet declare ESLint 10 compatibility; track
that coordinated upgrade through dependency review.

Do not manually edit lockfile resolutions, generated PWA output in `dist/`, or runtime caches.
Preserve vendor licenses. Dependency updates must pass a clean install, `pnpm check`, and
`pnpm build`, and the browser suite when runtime behavior is affected.
