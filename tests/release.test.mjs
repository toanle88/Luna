import assert from "node:assert/strict";
import { test } from "node:test";
import { validateRelease } from "../scripts/check-release.mjs";

const changelog = "# Changelog\n\n## [Unreleased]\n\n## [0.1.0] - 2026-11-08\n\nInitial release.\n";
test("release accepts a matching stable version with a dated changelog entry", () => {
  assert.equal(validateRelease({ tag: "v0.1.0", version: "0.1.0", changelog }), "0.1.0");
});
test("release rejects a tag that does not match package.json", () => {
  assert.throws(
    () => validateRelease({ tag: "v0.2.0", version: "0.1.0", changelog }),
    /does not match/,
  );
});
test("release rejects missing or undated changelog entries", () => {
  for (const text of ["# Changelog", "## [0.1.0]"]) {
    assert.throws(
      () => validateRelease({ tag: "v0.1.0", version: "0.1.0", changelog: text }),
      /dated entry/,
    );
  }
});
test("release rejects moving labels, leading zeroes and unconfigured prerelease tags", () => {
  for (const tag of ["latest", "0.1.0", "v01.1.0", "v0.1.0-rc.1"]) {
    assert.throws(() => validateRelease({ tag, version: "0.1.0", changelog }), /stable SemVer/);
  }
});
