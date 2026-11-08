import { readFile, writeFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const root = path.resolve("dist/client");
async function collect(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const all = await Promise.all(
    entries
      .filter((e) => !e.name.startsWith("."))
      .map(async (e) =>
        e.isDirectory() ? collect(path.join(dir, e.name)) : path.join(dir, e.name),
      ),
  );
  return all.flat();
}
const files = (await collect(root))
  .filter(
    (file) => /\.(?:js|css|png|svg|woff2?|webmanifest)$/.test(file) && !file.endsWith("/sw.js"),
  )
  .sort();
const urls = [
  "/",
  ...files.map((file) => "/" + path.relative(root, file).split(path.sep).join("/")),
];
const hash = createHash("sha256");
for (const file of files) hash.update(await readFile(file));
const template = await readFile("public/sw.js", "utf8");
hash.update(template);
const version = hash.digest("hex").slice(0, 16);
const sw = template
  .replace(
    /\/\* CACHE_NAME \*\/[\s\S]*?\/\* END_CACHE_NAME \*\//,
    JSON.stringify("luna-shell-" + version),
  )
  .replace(/\/\* PRECACHE_URLS \*\/[\s\S]*?\/\* END_PRECACHE_URLS \*\//, JSON.stringify(urls));
await writeFile(path.join(root, "sw.js"), sw);
console.log(`PWA: ${urls.length} app-shell resources, cache ${version}`);
