import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const files = readdirSync(root)
  .filter((name) => name.endsWith(".md"))
  .map((name) => resolve(root, name));
for (const directory of ["docs", ".github"]) {
  const entries = readdirSync(resolve(root, directory), { recursive: true, withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(resolve(entry.parentPath, entry.name));
    }
  }
}
let links = 0;
const failures = [];
for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1];
    if (/^(?:[a-z][a-z\d+.-]*:|#|\/\/)/i.test(target)) continue;
    const path = decodeURIComponent(target.split(/[?#]/)[0]);
    if (!path) continue;
    links += 1;
    if (!existsSync(resolve(dirname(file), path))) failures.push(`${file}: ${target}`);
  }
}
if (failures.length) throw new Error(`Broken local documentation links:\n${failures.join("\n")}`);
console.log(`Documentation verified: ${files.length} Markdown files, ${links} local links.`);
