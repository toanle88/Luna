import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** Reject mismatched tags and undocumented releases before publishing. */
export function validateRelease({ tag, version, changelog }) {
  if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag)) {
    throw new Error("Use a stable SemVer tag such as v0.1.0.");
  }
  if (tag !== `v${version}`) {
    throw new Error(`Tag ${tag} does not match package.json version ${version}.`);
  }
  const escaped = version.replaceAll(".", "\\.");
  if (!new RegExp(`^## \\[${escaped}\\] - \\d{4}-\\d{2}-\\d{2}$`, "m").test(changelog)) {
    throw new Error(`CHANGELOG.md needs a dated entry for ${version}.`);
  }
  return version;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const changelog = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");
  const tag = process.argv[2] ?? process.env.RELEASE_TAG ?? `v${manifest.version}`;
  const version = validateRelease({ tag, version: manifest.version, changelog });
  console.log(`Release ${version} matches its tag and changelog.`);
}
