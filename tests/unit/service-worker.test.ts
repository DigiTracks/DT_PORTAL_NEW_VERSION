import { describe, expect, it } from "vitest";
import { GET } from "../../apps/sourcecraft/src/pages/sw.js.ts";

type Handler = (event: any) => void;

async function loadWorker(options: { fetch: (req: Request) => Promise<Response> }) {
  const handlers: Record<string, Handler> = {};
  const stores = new Map<string, Map<string, Response>>();
  const cacheApi = (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    return {
      put: async (req: Request, res: Response) => { store.set(new URL(req.url).pathname, res); },
      addAll: async (paths: string[]) => { for (const p of paths) store.set(p, new Response(`shell ${p}`)); },
      match: async (req: Request) => store.get(new URL(req.url).pathname),
    };
  };
  const caches = {
    open: async (name: string) => cacheApi(name),
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    match: async (req: Request) => {
      for (const store of stores.values()) {
        const hit = store.get(new URL(req.url).pathname);
        if (hit) return hit;
      }
      return undefined;
    },
  };
  const self = {
    location: { origin: "https://portal.test" },
    addEventListener: (type: string, fn: Handler) => { handlers[type] = fn; },
    skipWaiting: async () => undefined,
    clients: { claim: async () => undefined },
  };
  const source = await GET().text();
  new Function("self", "caches", "fetch", "URL", source)(self, caches, options.fetch, URL);

  const run = async (type: string, request: Request) => {
    const waits: Promise<unknown>[] = [];
    let responded: Promise<Response> | undefined;
    handlers[type]({
      request,
      waitUntil: (p: Promise<unknown>) => waits.push(p),
      respondWith: (p: Promise<Response>) => { responded = p; },
    });
    await Promise.all(waits);
    return responded;
  };
  return { run, stores, handlers };
}

const origin = "https://portal.test";

describe("sourcecraft service worker", () => {
  it("evicts the v2 cache on activate and keeps only the current cache", async () => {
    const worker = await loadWorker({ fetch: async () => new Response("x") });
    worker.stores.set("sourcecraft-shell-v2", new Map([["/data/library.json", new Response("old")]]));
    await worker.run("activate", new Request(`${origin}/`));
    expect([...worker.stores.keys()]).not.toContain("sourcecraft-shell-v2");
  });

  it("serves library.json from the network when online, updating the cache", async () => {
    const fresh = new Response(JSON.stringify({ version: 2 }), { status: 200 });
    const worker = await loadWorker({ fetch: async () => fresh.clone() });
    worker.stores.set("sourcecraft-shell-v3", new Map([["/data/library.json", new Response(JSON.stringify({ version: 1 }))]]));
    const response = await worker.run("fetch", new Request(`${origin}/data/library.json`));
    expect(await response!.json()).toEqual({ version: 2 });
    expect(await (worker.stores.get("sourcecraft-shell-v3")!.get("/data/library.json"))!.json()).toEqual({ version: 2 });
  });

  it("falls back to the cached library.json when offline", async () => {
    const worker = await loadWorker({ fetch: async () => { throw new TypeError("offline"); } });
    worker.stores.set("sourcecraft-shell-v3", new Map([["/data/library.json", new Response(JSON.stringify({ version: 1 }))]]));
    const response = await worker.run("fetch", new Request(`${origin}/data/library.json`));
    expect(await response!.json()).toEqual({ version: 1 });
  });

  it("keeps /_astro/ assets cache-first (no network when cached)", async () => {
    let networkCalls = 0;
    const worker = await loadWorker({ fetch: async () => { networkCalls += 1; return new Response("net"); } });
    worker.stores.set("sourcecraft-shell-v3", new Map([["/_astro/app.js", new Response("cached")]]));
    const response = await worker.run("fetch", new Request(`${origin}/_astro/app.js`));
    expect(await response!.text()).toBe("cached");
    expect(networkCalls).toBe(0);
  });
});
