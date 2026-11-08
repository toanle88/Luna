import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
const origin = "https://luna.example";
function harness() {
  const handlers = {},
    stores = new Map(),
    state = { offline: false, claimed: false, skipped: false };
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async addAll(requests) {
          for (const request of requests)
            store.set(
              new URL(request.url).pathname,
              new Response("cached " + new URL(request.url).pathname),
            );
        },
        async match(key) {
          return store.get(typeof key === "string" ? key : new URL(key.url).pathname)?.clone();
        },
        async put(key, response) {
          store.set(typeof key === "string" ? key : new URL(key.url).pathname, response.clone());
        },
      };
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(key) {
      return stores.delete(key);
    },
  };
  const context = {
    URL,
    Response,
    caches,
    Request: class extends Request {
      constructor(url, options) {
        super(new URL(url, origin), options);
      }
    },
    fetch: async () => {
      if (state.offline) throw Error("Offline");
      return new Response("fresh online page");
    },
    self: {
      location: { origin },
      addEventListener: (name, handler) => (handlers[name] = handler),
      skipWaiting: async () => (state.skipped = true),
      clients: { claim: async () => (state.claimed = true) },
    },
  };
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"), context);
  async function run(name) {
    let pending;
    handlers[name]({ waitUntil: (p) => (pending = p) });
    await pending;
  }
  function fetchEvent(request) {
    let response;
    handlers.fetch({ request, respondWith: (p) => (response = p) });
    return response;
  }
  return { run, fetchEvent, stores, state };
}
test("install precaches the public shell; activation removes only old Luna caches", async () => {
  const h = harness();
  h.stores.set("other-app", new Map());
  h.stores.set("luna-shell-old", new Map());
  await h.run("install");
  assert.equal(h.state.skipped, true);
  await h.run("activate");
  assert.equal(h.state.claimed, true);
  assert.equal(h.stores.has("other-app"), true);
  assert.equal(h.stores.has("luna-shell-old"), false);
  assert.ok([...h.stores.values()].some((cache) => cache.has("/")));
});
test("offline navigation returns the cached app shell", async () => {
  const h = harness();
  await h.run("install");
  h.state.offline = true;
  const response = await h.fetchEvent({ method: "GET", url: origin + "/", mode: "navigate" });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "cached /");
});
test("online navigation refreshes the offline shell for the next offline opening", async () => {
  const h = harness();
  await h.run("install");
  await h.fetchEvent({ method: "GET", url: origin + "/", mode: "navigate" });
  h.state.offline = true;
  const response = await h.fetchEvent({ method: "GET", url: origin + "/", mode: "navigate" });
  assert.equal(await response.text(), "fresh online page");
});
test("service worker leaves API, non-GET, and external requests untouched", () => {
  const h = harness();
  for (const request of [
    { method: "POST", url: origin + "/", mode: "cors" },
    { method: "GET", url: origin + "/api/private", mode: "cors" },
    { method: "GET", url: "https://other.example/favicon.svg", mode: "cors" },
  ])
    assert.equal(h.fetchEvent(request), undefined);
});
test("manifest has standalone scope and valid regular, maskable and Apple icons", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
  );
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.lang, "vi");
  assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));
  for (const icon of [
    ...manifest.icons,
    { src: "/icons/apple-touch-icon.png", sizes: "180x180" },
  ]) {
    const png = readFileSync(new URL("../public" + icon.src, import.meta.url));
    const [width, height] = icon.sizes.split("x").map(Number);
    assert.equal(png.readUInt32BE(16), width);
    assert.equal(png.readUInt32BE(20), height);
  }
});
