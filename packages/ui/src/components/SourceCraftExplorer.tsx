import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { RouteRecord } from "@digitracks/seo";
import { runMigrations, sourceCraftKeys } from "@digitracks/state";

interface ExplorerState {
  favourites: string[];
  recents: string[];
}

interface SourceCraftRecord {
  path: string;
  title: string;
  description: string;
  contentStatus?: RouteRecord["contentStatus"];
}

interface SourceCraftExplorerProps {
  routes: readonly SourceCraftRecord[];
  initialFavouritesOnly?: boolean;
}

const initialState: ExplorerState = { favourites: [], recents: [] };
interface ExplorerFilters {
  query: string;
  region: string;
  favouritesOnly: boolean;
}
const migrations = [{
  from: 0,
  to: 1,
  migrate(value: unknown): ExplorerState {
    if (!value || typeof value !== "object") return initialState;
    const candidate = value as Partial<ExplorerState>;
    return {
      favourites: Array.isArray(candidate.favourites) ? candidate.favourites.filter((item): item is string => typeof item === "string").slice(0, 500) : [],
      recents: Array.isArray(candidate.recents) ? candidate.recents.filter((item): item is string => typeof item === "string").slice(0, 50) : []
    };
  }
}];

function validPaths(value: string[]): string[] {
  return [...new Set(value.filter((path) => path.startsWith("/") && path.length < 240))];
}

function readExplorerFilters(params: URLSearchParams, regions: readonly string[], initialFavouritesOnly: boolean): ExplorerFilters {
  const requestedRegion = params.get("region");
  return {
    query: (params.get("q") ?? "").slice(0, 160),
    region: requestedRegion === "all" || regions.includes(requestedRegion ?? "") ? requestedRegion ?? "all" : "all",
    favouritesOnly: params.has("saved") ? params.get("saved") === "1" : initialFavouritesOnly
  };
}

function writeExplorerUrl(state: ExplorerFilters, initialFavouritesOnly: boolean, mode: "push" | "replace") {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const normalizedQuery = state.query.trim();
  if (normalizedQuery) params.set("q", normalizedQuery.slice(0, 160));
  else params.delete("q");
  if (state.region === "all") params.delete("region");
  else params.set("region", state.region);
  if (state.favouritesOnly) params.set("saved", "1");
  else if (initialFavouritesOnly) params.set("saved", "0");
  else params.delete("saved");
  const next = `${url.pathname}${params.toString() ? `?${params.toString()}` : ""}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) window.history[mode === "push" ? "pushState" : "replaceState"](window.history.state, "", next);
}

export default function SourceCraftExplorer({ routes, initialFavouritesOnly = false }: SourceCraftExplorerProps) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [favouritesOnly, setFavouritesOnly] = useState(initialFavouritesOnly);
  const [state, setState] = useState<ExplorerState>(initialState);
  const [undoState, setUndoState] = useState<ExplorerState | null>(null);
  const [storageState, setStorageState] = useState<"loading" | "ready" | "unavailable" | "reset">("loading");
  const [urlStateReady, setUrlStateReady] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const interactionReady = storageState !== "loading" && urlStateReady;

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useLayoutEffect(() => {
    try {
      const savedFavourites = localStorage.getItem(sourceCraftKeys.favourites);
      const savedRecents = localStorage.getItem(sourceCraftKeys.recents);
      const favourites = savedFavourites ? runMigrations(JSON.parse(savedFavourites), migrations, initialState).data.favourites : [];
      const recents = savedRecents ? runMigrations(JSON.parse(savedRecents), migrations, initialState).data.recents : [];
      setState({ favourites: validPaths(favourites), recents: validPaths(recents) });
      setStorageState("ready");
    } catch {
      setState(initialState);
      setStorageState("reset");
    }
  }, []);

  useEffect(() => {
    if (storageState !== "ready") return;
    try {
      localStorage.setItem(sourceCraftKeys.favourites, JSON.stringify({ version: 1, data: { favourites: state.favourites, recents: [] } }));
      localStorage.setItem(sourceCraftKeys.recents, JSON.stringify({ version: 1, data: { favourites: [], recents: state.recents } }));
    } catch {
      setStorageState("unavailable");
    }
  }, [state, storageState]);

  const regions = useMemo(() => [...new Set(routes
    .filter((route) => route.path.startsWith("/regions/") && route.path !== "/regions/")
    .map((route) => route.path.split("/")[2]))], [routes]);

  const applyUrlState = useCallback((params: URLSearchParams) => {
    const next = readExplorerFilters(params, regions, initialFavouritesOnly);
    setQuery(next.query);
    setRegion(next.region);
    setFavouritesOnly(next.favouritesOnly);
    return next;
  }, [initialFavouritesOnly, regions]);

  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("q") || params.has("region") || params.has("saved") || initialFavouritesOnly) {
      writeExplorerUrl(applyUrlState(params), initialFavouritesOnly, "replace");
    } else {
      applyUrlState(params);
    }
    setUrlStateReady(true);
  }, [applyUrlState, initialFavouritesOnly]);

  useEffect(() => {
    if (!urlStateReady) return;
    function restoreFromHistory() {
      applyUrlState(new URLSearchParams(window.location.search));
    }
    window.addEventListener("popstate", restoreFromHistory);
    return () => window.removeEventListener("popstate", restoreFromHistory);
  }, [applyUrlState, urlStateReady]);

  const visibleRoutes = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return routes.filter((route) => {
      const matchesQuery = !needle || `${route.title} ${route.description} ${route.path}`.toLowerCase().includes(needle);
      const matchesRegion = region === "all" || route.path === "/regions/" || route.path.startsWith(`/regions/${region}/`);
      const matchesFavourites = !favouritesOnly || state.favourites.includes(route.path);
      return matchesQuery && matchesRegion && matchesFavourites;
    });
  }, [routes, query, region, favouritesOnly, state.favourites]);

  function commitFilters(next: Partial<ExplorerFilters>, mode: "push" | "replace") {
    const resolved = { query, region, favouritesOnly, ...next };
    setQuery(resolved.query);
    setRegion(resolved.region);
    setFavouritesOnly(resolved.favouritesOnly);
    writeExplorerUrl(resolved, initialFavouritesOnly, mode);
  }

  function changeQuery(value: string) {
    commitFilters({ query: value.slice(0, 160) }, "replace");
  }

  function changeRegion(value: string) {
    commitFilters({ region: value }, "push");
  }

  function toggleFavourites() {
    commitFilters({ favouritesOnly: !favouritesOnly }, "push");
  }

  function resetFilters() {
    commitFilters({ query: "", region: "all", favouritesOnly: false }, "push");
  }

  function toggleFavourite(path: string) {
    setUndoState(null);
    setState((current) => ({
      ...current,
      favourites: current.favourites.includes(path)
        ? current.favourites.filter((item) => item !== path)
        : [...current.favourites, path]
    }));
  }

  function remember(path: string) {
    setUndoState(null);
    setState((current) => ({ ...current, recents: [path, ...current.recents.filter((item) => item !== path)].slice(0, 50) }));
  }

  function clearLocalList() {
    setUndoState(state);
    setState(initialState);
  }

  function restoreLocalList() {
    if (!undoState) return;
    setState(undoState);
    setUndoState(null);
  }

  function exportFavourites() {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), favourites: state.favourites }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "sourcecraft-favourites.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="source-explorer" aria-busy={!interactionReady}>
      <div className="source-explorer__controls">
        <label className="field-label" htmlFor="source-search">Search the public index</label>
        <div className="source-search">
          <input ref={searchRef} id="source-search" type="search" value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Try “approval” or “United States”" autoComplete="off" maxLength={160} disabled={!interactionReady} aria-keyshortcuts="Control+K Meta+K" />
          <span aria-hidden="true">⌘ K</span>
        </div>
        <div className="source-filter-row">
          <label className="field-label" htmlFor="source-region">Region</label>
          <select id="source-region" value={region} onChange={(event) => changeRegion(event.target.value)} disabled={!interactionReady}>
            <option value="all">All regions</option>
            {regions.map((item) => <option key={item} value={item}>{item.replaceAll("-", " / ")}</option>)}
          </select>
          <button className="filter-toggle" type="button" aria-pressed={favouritesOnly} onClick={toggleFavourites} disabled={!interactionReady}>
            Favourites <span>{state.favourites.length}</span>
          </button>
        </div>
        <div className="source-explorer__status" role="status">
          <span>{interactionReady ? `${visibleRoutes.length} of ${routes.length} public records` : `${routes.length} public records`}</span>
          <span>{!interactionReady ? "Reading local list" : storageState === "ready" ? "Saved on this device" : "Local saving unavailable"}</span>
        </div>
      </div>

      <div className="source-results">
        {!interactionReady && favouritesOnly ? (
          <div className="source-empty" role="status">
            <p className="t-label">Reading local list</p>
            <h3>Opening your saved routes.</h3>
            <p>Favourites are read from this device before the filtered list is shown.</p>
          </div>
        ) : visibleRoutes.length ? (
          <ol className="source-records">
            {visibleRoutes.map((route, index) => {
              const favourite = state.favourites.includes(route.path);
              const label = route.path.startsWith("/terms/") ? "Term index" : route.path.startsWith("/regions/") ? "Regional pack" : "Public page";
              return (
                <li key={route.path} className="source-record">
                  <span className="source-record__number">{String(index + 1).padStart(3, "0")}</span>
                  <div className="source-record__body">
                    <p className="t-label">{label} / {route.contentStatus === "approved" ? "Approved" : "Not indexed"}</p>
                    <h3><a href={route.path} onClick={() => remember(route.path)}>{route.title}</a></h3>
                    <p>{route.description}</p>
                    <code>{route.path}</code>
                  </div>
                  <button className="favourite-button" type="button" aria-pressed={favourite} aria-label={`${favourite ? "Saved" : "Save"}: ${route.title}`} onClick={() => toggleFavourite(route.path)} disabled={!interactionReady}>
                    {favourite ? "Saved" : "Save"}
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="source-empty">
            <p className="t-label">No matching public record</p>
            <h3>Try a broader term.</h3>
            <p>The index searches route metadata only. Rights-reserved definitions and notes are not published in this build.</p>
            <button className="button button--secondary" type="button" onClick={resetFilters} disabled={!interactionReady}>Reset filters</button>
          </div>
        )}
      </div>

      <div className="source-local-tools">
        <div>
          <p className="t-label">On this device</p>
          <h3>Your reading list stays here.</h3>
          <p>Favourites and recent routes use the SourceCraft storage namespace. Nothing is sent to another Digi Tracks origin.</p>
        </div>
        <div className="source-local-tools__actions">
          <button className="button button--quiet" type="button" onClick={exportFavourites} data-analytics-event="resource_export" data-resource-id="sourcecraft-favourites" disabled={!interactionReady || !state.favourites.length}>Export favourites</button>
          <button className="text-button" type="button" onClick={clearLocalList} disabled={!interactionReady || (!state.favourites.length && !state.recents.length)}>Clear local list</button>
          {undoState && <button className="text-button" type="button" onClick={restoreLocalList}>Undo clear</button>}
        </div>
      </div>
    </div>
  );
}
