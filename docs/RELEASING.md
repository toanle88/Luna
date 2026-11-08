# Versioning and releases

Luna uses stable Semantic Versioning tags such as `v0.1.0`. The package is a private application
package; the workflow creates GitHub Releases and does not publish to npm or deploy the hosted site.

## Version policy

- **Patch**: backward-compatible fixes and maintenance.
- **Minor**: backward-compatible features. During `0.x`, document any intentional breaking change
  explicitly.
- **Major**: incompatible stable public behavior after `1.0.0`.
- Storage and backup schema versions are separate and need explicit migrations when changed.

Only stable `vMAJOR.MINOR.PATCH` tags are supported by the current release workflow. Prereleases
require an explicit policy/workflow update first. Tags are immutable; do not move one to repair a
release.

## Pull requests and changelog

Use Conventional Commit-style PR titles and squash merge. Keep unreleased user-visible changes under
`## [Unreleased]` in [CHANGELOG.md](../CHANGELOG.md). The changelog is curated; release notes can
also summarize merged PRs.

## Prepare a release

1. Start from current `main` and create a release-preparation branch.
2. Choose the next version. For example:

   ```bash
   pnpm version patch --no-git-tag-version
   ```

3. Move the relevant changelog entries into `## [X.Y.Z] - YYYY-MM-DD`, using the actual release
   date. Keep an empty `Unreleased` section.
4. Run `pnpm check`, `pnpm build`, and `pnpm release:check`.
5. Commit the version/changelog changes and merge the reviewed pull request after CI passes.

The initial `0.1.0` entry is already prepared; it is not a claim that its release tag has been
published.

## Publish the merged commit

After checking that local `main` is the merged remote commit:

```bash
git switch main
git pull --ff-only origin main
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

Replace `X.Y.Z` with the version in `package.json`. The tag workflow installs from the frozen
lockfile, runs all checks, verifies the tag against package.json and a dated changelog entry, and
builds production/PWA assets. Only then does a separate job with `contents: write` publish a GitHub
Release with generated notes. Other jobs keep read-only repository access.

A failed validation does not create a release. Fix the preparation on a new commit; if no release
was published, investigate the failed tag before deciding how to recover. Never force-update an
already published tag.
