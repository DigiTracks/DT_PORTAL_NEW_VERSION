import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { storageKey } from "@digitracks/state";

interface SherpaRecord {
  path: string;
  title: string;
  description: string;
}

interface ProcureSherpaShellProps {
  records: readonly SherpaRecord[];
}

const notesKey = storageKey("procuresherpa", "review-notes:v1");
const groupLabels: Readonly<Record<string, string>> = {
  academy: "Academy",
  approvals: "Approvals",
  audit: "Audit",
  backup: "Backup",
  calc: "Calculators",
  cl: "Contract library",
  contracts: "Contracts",
  "dash-savings": "Savings dashboard",
  dec: "Decision tools",
  fav: "Favourites",
  glossary: "Glossary",
  help: "Help",
  k: "Knowledge",
  kpi: "KPI library",
  "learning-paths": "Learning paths",
  lifecycle: "Lifecycle",
  list: "Lists",
  maturity: "Maturity",
  quickstart: "Quickstart",
  recent: "Recent",
  scen: "Scenarios",
  settings: "Settings",
  sop: "Procedures",
  "spend-model": "Spend model",
  suppliers: "Suppliers",
  tpl: "Templates",
  what: "Overview"
};

function hashPath(route: SherpaRecord): string {
  return route.path.slice(route.path.indexOf("#"));
}

export default function ProcureSherpaShell({ records: routes }: ProcureSherpaShellProps) {
  const [activePath, setActivePath] = useState("#/quickstart");
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [undoNotes, setUndoNotes] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"loading" | "saved" | "memory" | "error">("loading");
  const [routeStateReady, setRouteStateReady] = useState(false);
  const [urlStateReady, setUrlStateReady] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    function syncRoute() {
      setActivePath(window.location.hash || "#/quickstart");
      setRouteStateReady(true);
    }
    syncRoute();
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  const restoreQuery = useCallback(() => {
    setQuery((new URLSearchParams(window.location.search).get("q") ?? "").slice(0, 160));
  }, []);

  useLayoutEffect(() => {
    restoreQuery();
    setUrlStateReady(true);
  }, [restoreQuery]);

  useEffect(() => {
    if (!urlStateReady) return;
    window.addEventListener("popstate", restoreQuery);
    return () => window.removeEventListener("popstate", restoreQuery);
  }, [restoreQuery, urlStateReady]);

  useLayoutEffect(() => {
    if (!urlStateReady) return;
    const url = new URL(window.location.href);
    const normalizedQuery = query.trim();
    if (normalizedQuery) url.searchParams.set("q", normalizedQuery.slice(0, 160));
    else url.searchParams.delete("q");
    const next = `${url.pathname}${url.search}${url.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) window.history.replaceState(window.history.state, "", next);
  }, [query, urlStateReady]);

  useLayoutEffect(() => {
    try {
      const raw = localStorage.getItem(notesKey);
      if (raw) {
        const envelope = JSON.parse(raw) as { version?: unknown; data?: unknown };
        if (envelope.version !== 1 || typeof envelope.data !== "string" || envelope.data.length > 20_000) throw new Error("Invalid local notes");
        setNotes(envelope.data);
      }
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, []);

  useEffect(() => {
    if (saveState === "loading") return;
    try {
      localStorage.setItem(notesKey, JSON.stringify({ version: 1, data: notes }));
      setSaveState("saved");
    } catch {
      setSaveState("memory");
    }
  }, [notes, saveState]);

  useEffect(() => {
    if (saveState !== "memory" || !notes) return;
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [notes, saveState]);

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

  const groups = useMemo(() => [...new Set(routes.map((route) => route.path.split("/")[2]))]
    .map((id) => ({ id, label: groupLabels[id] ?? id, count: routes.filter((route) => route.path.split("/")[2] === id).length })), [routes]);
  const activeRoute = routes.find((route) => hashPath(route) === activePath);
  const matchingRoutes = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? routes.filter((route) => `${route.title} ${route.description} ${route.path}`.toLowerCase().includes(needle)) : [];
  }, [routes, query]);
  const visibleRoutes = matchingRoutes.slice(0, 80);

  function updateNotes(value: string) {
    setUndoNotes(null);
    setNotes(value);
  }

  function clearNotes() {
    setUndoNotes(notes);
    setNotes("");
  }

  function restoreNotes() {
    if (undoNotes === null) return;
    setNotes(undoNotes);
    setUndoNotes(null);
  }

  function exportNotes() {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), notes }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "procuresherpa-review-notes.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="sherpa-workspace" aria-busy={!routeStateReady || !urlStateReady || saveState === "loading"}>
      <div className="sherpa-app__frame">
        <aside className="sherpa-rail" aria-label="Workspace areas">
          <p className="t-label">Workspace index</p>
          <nav>
            {groups.map((group) => <a key={group.id} href={`/#/${group.id}`} aria-current={activePath === `#/${group.id}` ? "page" : undefined}>
              <span>{group.label}</span><small>{group.count}</small>
            </a>)}
          </nav>
          <div className="sherpa-rail__boundary">
            <strong>Public preview</strong>
            <p>Application parity needs authorised source and data. This shell preserves navigation without pretending to run the original product.</p>
          </div>
        </aside>

        <div className="sherpa-main">
          <div className="sherpa-main__toolbar">
            <label className="field-label" htmlFor="sherpa-search">Search guides</label>
            <input ref={searchRef} id="sherpa-search" type="search" value={query} onChange={(event) => setQuery(event.target.value.slice(0, 160))} placeholder="Search Academy, contracts, templates…" maxLength={160} disabled={!urlStateReady} aria-keyshortcuts="Control+K Meta+K" />
          </div>

          {!routeStateReady || !urlStateReady ? (
            <div className="sherpa-route" role="status">
              <p className="t-label">Workspace route</p>
              <h2>Opening the guide…</h2>
              <p>The route and search context are being restored from this address.</p>
            </div>
          ) : query.trim() ? (
            <div className="sherpa-route-results" aria-live="polite">
              <p className="t-label">{matchingRoutes.length} matching routes{matchingRoutes.length > visibleRoutes.length ? ` · showing first ${visibleRoutes.length}` : ""}</p>
              {visibleRoutes.length ? <ul>{visibleRoutes.map((route) => <li key={route.path}><a href={route.path}><strong>{route.title.replace(" | Digi Tracks", "")}</strong><span>{route.description}</span><code>{hashPath(route)}</code></a></li>)}</ul> : <p>No route matches that search.</p>}
            </div>
          ) : activeRoute ? (
            <article className="sherpa-route">
              <div className="sherpa-route__heading">
                <p className="t-label">{groupLabels[activePath.split("/")[2]] ?? "Workspace"} / preserved identifier</p>
                <h2>{activeRoute.title.replace(" | Digi Tracks", "")}</h2>
                <p>{activeRoute.description}</p>
                <code>{activePath}</code>
              </div>
              <div className="sherpa-route__notice">
                <strong>Content boundary</strong>
                <p>The route exists in the audited manifest. Its application data, calculations and learning content are not reproduced without authorised source, fixtures and permission.</p>
              </div>
              {routes.filter((route) => route.path.split("/")[2] === activePath.split("/")[2] && route.path !== activeRoute.path).length > 0 && (
                <div className="sherpa-route__related">
                  <p className="t-label">In this area</p>
                  <ul>{routes.filter((route) => route.path.split("/")[2] === activePath.split("/")[2] && route.path !== activeRoute.path).slice(0, 8).map((route) => <li key={route.path}><a href={route.path}>{route.title.replace(" | Digi Tracks", "")}</a></li>)}</ul>
                </div>
              )}
            </article>
          ) : (
            <article className="sherpa-route">
              <p className="t-label">Route not found</p>
              <h2>That address is not in the preserved manifest.</h2>
              <p>Choose a workspace area from the navigation or return to Quickstart.</p>
              <a className="button button--secondary" href="#/quickstart">Open Quickstart</a>
            </article>
          )}

          <section className="sherpa-notes" aria-labelledby="sherpa-notes-title">
            <div className="sherpa-notes__intro">
              <p className="t-label">Independent local utility</p>
              <h2 id="sherpa-notes-title">Review notes.</h2>
              <p>This scratchpad belongs to the public shell, not to ProcureSherpa records. Keep confidential, personal or commercially sensitive information out of it.</p>
            </div>
            <div className="sherpa-notes__editor">
              <label className="field-label" htmlFor="sherpa-notes">Notes saved on this device</label>
              <textarea id="sherpa-notes" value={notes} maxLength={20_000} onChange={(event) => updateNotes(event.target.value)} placeholder="Questions to take into a qualified demo…" rows={8} disabled={saveState === "loading"} />
              <div className="sherpa-notes__status" role="status">
                <span>{saveState === "saved" ? "Saved locally" : saveState === "loading" ? "Reading local state" : "Memory only — export to keep a copy"}</span>
                <span>{notes.length.toLocaleString()} / 20,000</span>
              </div>
              <div className="button-row">
                <button className="button button--secondary" type="button" onClick={exportNotes} data-analytics-event="resource_export" data-resource-id="procuresherpa-notes" disabled={saveState === "loading" || !notes}>Export notes</button>
                <button className="text-button" type="button" onClick={clearNotes} disabled={saveState === "loading" || !notes}>Clear notes</button>
                {undoNotes !== null && <button className="text-button" type="button" onClick={restoreNotes}>Undo clear</button>}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
