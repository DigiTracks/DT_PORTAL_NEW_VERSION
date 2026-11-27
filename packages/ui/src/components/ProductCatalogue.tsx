import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type MouseEvent } from "react";
import type { PublicProductRecord } from "@digitracks/catalog";
import Icon, { type IconName } from "./Icon";
import ProductMark from "./ProductMark";
import ProductSignal from "./ProductSignal";

interface ProductCatalogueProps {
  products: readonly PublicProductRecord[];
  demoEligibleProductIds: readonly string[];
  contactHref: string;
}

interface Discipline {
  id: string;
  label: string;
  note: string;
  productIds: readonly string[];
}

type CatalogueView = "all" | "flagships" | "family" | "free" | "prelaunch";

const disciplines: readonly Discipline[] = [
  {
    id: "operations",
    label: "Enterprise & operations",
    note: "Connected business systems and modular capability",
    productIds: ["unify", "nexora", "arventa", "monexa", "workzen", "connexa", "orbitra"],
  },
  {
    id: "procurement",
    label: "Procurement & sourcing",
    note: "Source, control, verify and realise value",
    productIds: ["vertex", "procure5", "procureleak", "tenderguard", "contractleak", "procuredecision", "procureoutcomes", "sherpa", "quote-simulator", "vantor"],
  },
  {
    id: "education",
    label: "Education & learning",
    note: "Campus life, academics, placement and practice",
    productIds: ["vedik", "vedik-school-erp", "vedik-social", "unnati", "vedik-university", "campus-grid", "mindone", "mindone-pro"],
  },
  {
    id: "people",
    label: "People, health & wellness",
    note: "Clinical, recruiting and studio operations",
    productIds: ["chronos", "glowra", "nipuna"],
  },
  {
    id: "engineering",
    label: "Engineering & security",
    note: "Code intelligence, security and delivery tooling",
    productIds: ["orion", "orion-hunter", "opspilot", "recon"],
  },
  {
    id: "field",
    label: "Projects, sites & logistics",
    note: "Project delivery, freight and physical operations",
    productIds: ["construction", "transportation", "planora", "logistra", "procura"],
  },
];

const disciplineIcons: Record<string, IconName> = {
  operations: "building",
  procurement: "flow",
  education: "education",
  people: "users",
  engineering: "code",
  field: "map"
};

const viewLabels: Record<CatalogueView, string> = {
  all: "All catalogue records",
  flagships: "Flagship products",
  family: "Products within a family",
  free: "Free to use",
  prelaunch: "Request-only routes",
};

const buyingLabels: Record<PublicProductRecord["buyingModel"], string> = {
  free: "Free to use",
  "quote-led": "Quote-led",
  subscription: "Subscription",
  "one-off": "One-off",
  unknown: "Confirm during evaluation",
};

function isCatalogueView(value: string | null): value is CatalogueView {
  return value !== null && Object.hasOwn(viewLabels, value);
}

interface CatalogueState {
  query: string;
  disciplineId: string;
  view: CatalogueView;
  activeProductId: string;
}

function filterCatalogueProducts(products: readonly PublicProductRecord[], state: CatalogueState) {
  const normalizedQuery = state.query.trim().toLowerCase();
  return products.filter((product) => {
    const inDiscipline = state.disciplineId === "all" || disciplines.find((discipline) => discipline.id === state.disciplineId)?.productIds.includes(product.id);
    const inView = state.view === "all"
      || (state.view === "flagships" && !product.parentId)
      || (state.view === "family" && Boolean(product.parentId))
      || (state.view === "free" && product.buyingModel === "free")
      || (state.view === "prelaunch" && product.availability === "request-only");
    const searchable = [product.name, product.summary, product.description, product.category, product.deployment, product.status, ...product.capabilities]
      .join(" ")
      .toLowerCase();
    return inDiscipline && inView && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
}

function resolveActiveProduct(products: readonly PublicProductRecord[], state: CatalogueState) {
  const visibleProducts = filterCatalogueProducts(products, state);
  return visibleProducts.find((product) => product.id === state.activeProductId) ?? visibleProducts[0];
}

function readCatalogueState(params: URLSearchParams, products: readonly PublicProductRecord[]): CatalogueState {
  const requestedDiscipline = params.get("discipline");
  const requestedView = params.get("view");
  const requestedProduct = params.get("product");
  const disciplineId = requestedDiscipline === "all" || disciplines.some((discipline) => discipline.id === requestedDiscipline)
    ? requestedDiscipline ?? "all"
    : "all";
  const state: CatalogueState = {
    query: (params.get("q") ?? "").slice(0, 160),
    disciplineId,
    view: isCatalogueView(requestedView) ? requestedView : "all",
    activeProductId: requestedProduct && products.some((product) => product.id === requestedProduct) ? requestedProduct : "vertex"
  };
  return { ...state, activeProductId: resolveActiveProduct(products, state)?.id ?? state.activeProductId };
}

function writeCatalogueUrl(state: CatalogueState, products: readonly PublicProductRecord[], mode: "push" | "replace") {
  const activeProduct = resolveActiveProduct(products, state);
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const normalizedQuery = state.query.trim();
  if (normalizedQuery) params.set("q", normalizedQuery.slice(0, 160));
  else params.delete("q");
  if (state.disciplineId === "all") params.delete("discipline");
  else params.set("discipline", state.disciplineId);
  if (state.view === "all") params.delete("view");
  else params.set("view", state.view);
  if (activeProduct) params.set("product", activeProduct.id);
  else params.delete("product");
  const search = params.toString();
  const next = `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) window.history[mode === "push" ? "pushState" : "replaceState"](window.history.state, "", next);
}

function Arrow() {
  return <Icon name="arrow" size={16} weight="bold" className="button__arrow" />;
}

export default function ProductCatalogue({ products, demoEligibleProductIds, contactHref }: ProductCatalogueProps) {
  const [query, setQuery] = useState("");
  const [disciplineId, setDisciplineId] = useState("all");
  const [view, setView] = useState<CatalogueView>("all");
  const [activeProductId, setActiveProductId] = useState("vertex");
  const [urlStateReady, setUrlStateReady] = useState(false);

  const catalogueCount = products.length;
  const flagshipCount = products.filter((product) => !product.parentId).length;
  const familyCount = products.filter((product) => product.parentId).length;
  const requestOnlyCount = products.filter((product) => product.availability === "request-only").length;
  const demoProductIds = useMemo(() => new Set(demoEligibleProductIds), [demoEligibleProductIds]);

  const orderedProducts = useMemo(() => disciplines.flatMap((discipline) => discipline.productIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is PublicProductRecord => Boolean(product))), [products]);

  const visibleProducts = useMemo(() => filterCatalogueProducts(orderedProducts, { query, disciplineId, view, activeProductId }), [activeProductId, disciplineId, orderedProducts, query, view]);

  const activeProduct = visibleProducts.find((product) => product.id === activeProductId) ?? visibleProducts[0];
  const activeChildren = activeProduct ? products.filter((product) => product.parentId === activeProduct.id) : [];
  const activeDiscipline = disciplines.find((discipline) => discipline.productIds.includes(activeProduct?.id ?? ""));
  const hasFilters = query.trim() !== "" || disciplineId !== "all" || view !== "all";
  const productIndex = activeProduct ? orderedProducts.findIndex((product) => product.id === activeProduct.id) + 1 : 0;
  const productSupportsDemo = Boolean(activeProduct && demoProductIds.has(activeProduct.id));
  const productRequestHref = activeProduct
    ? `/contact/?intent=${productSupportsDemo ? "demo" : "product-enquiry"}&product=${encodeURIComponent(activeProduct.id)}`
    : contactHref;
  const productRequestLabel = productSupportsDemo ? "Request full demo access" : "Register product interest";
  const productRequestNote = productSupportsDemo
    ? "Demo access is issued separately after qualification."
    : "An enquiry records interest only; product access is issued separately.";

  const applyUrlState = useCallback((params: URLSearchParams) => {
    const next = readCatalogueState(params, orderedProducts);
    setQuery(next.query);
    setDisciplineId(next.disciplineId);
    setView(next.view);
    setActiveProductId(next.activeProductId);
    return next;
  }, [orderedProducts]);

  useLayoutEffect(() => {
    const next = applyUrlState(new URLSearchParams(window.location.search));
    writeCatalogueUrl(next, orderedProducts, "replace");
    setUrlStateReady(true);
  }, [applyUrlState, orderedProducts]);

  useEffect(() => {
    if (!urlStateReady) return;
    function restoreFromHistory() {
      applyUrlState(new URLSearchParams(window.location.search));
    }
    window.addEventListener("popstate", restoreFromHistory);
    return () => window.removeEventListener("popstate", restoreFromHistory);
  }, [applyUrlState, urlStateReady]);

  function commitFilters(next: Partial<CatalogueState>, mode: "push" | "replace") {
    const draft: CatalogueState = { query, disciplineId, view, activeProductId, ...next };
    const activeProduct = resolveActiveProduct(orderedProducts, draft);
    const resolved: CatalogueState = {
      ...draft,
      activeProductId: activeProduct?.id ?? draft.activeProductId
    };
    setQuery(resolved.query);
    setDisciplineId(resolved.disciplineId);
    setView(resolved.view);
    setActiveProductId(resolved.activeProductId);
    writeCatalogueUrl(resolved, orderedProducts, mode);
  }

  function changeQuery(value: string) {
    commitFilters({ query: value.slice(0, 160) }, "replace");
  }

  function changeDiscipline(value: string) {
    commitFilters({ disciplineId: value }, "push");
  }

  function changeView(value: CatalogueView) {
    commitFilters({ view: value }, "push");
  }

  function resetFilters() {
    commitFilters({ query: "", disciplineId: "all", view: "all", activeProductId: "vertex" }, "push");
  }

  function selectProduct(event: MouseEvent<HTMLAnchorElement>, product: PublicProductRecord) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!window.matchMedia("(min-width: 64rem)").matches) return;
    event.preventDefault();
    commitFilters({ activeProductId: product.id }, "push");
  }

  return (
    <div className="product-catalogue">
      <section className="catalogue-hero" aria-labelledby="catalogue-title">
        <div className="catalogue-hero__word" aria-hidden="true">Atlas</div>
        <div className="shell catalogue-hero__grid">
          <div className="catalogue-hero__copy">
            <p className="t-label"><span className="signal-dot" aria-hidden="true"></span>The Digi Tracks product atlas</p>
            <h1 id="catalogue-title">Find your<br /><em>next system.</em></h1>
            <p className="catalogue-hero__lede">Explore {catalogueCount} Digi Tracks products and editions across six disciplines. Every record keeps its own deployment, licensing and access boundary.</p>
            <div className="button-row">
              <a className="button button--primary" href="#catalogue" data-cta="browse-product-catalogue">Browse the catalogue<Arrow /></a>
              <a className="button button--secondary" href={contactHref} data-cta="request-product-consultation">Start a conversation<Arrow /></a>
            </div>
          </div>

          <div className="catalogue-dial" aria-hidden="true">
            <div className="catalogue-dial__grid" />
            <div className="catalogue-dial__ring catalogue-dial__ring--outer" />
            <div className="catalogue-dial__ring catalogue-dial__ring--inner" />
            <div className="catalogue-dial__axis catalogue-dial__axis--x" />
            <div className="catalogue-dial__axis catalogue-dial__axis--y" />
            <div className="catalogue-dial__core"><strong>{String(catalogueCount).padStart(2, "0")}</strong><span>catalogue<br />entries</span></div>
            {disciplines.map((discipline, index) => {
              const count = discipline.productIds.filter((id) => products.some((product) => product.id === id)).length;
              return (
                <div className={`catalogue-dial__label catalogue-dial__label--${index + 1}`} key={discipline.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <Icon name={disciplineIcons[discipline.id]} size={20} weight="duotone" />
                  <strong>{discipline.label}</strong>
                  <small>{String(count).padStart(2, "0")} records</small>
                </div>
              );
            })}
            <span className="catalogue-dial__coordinate catalogue-dial__coordinate--a">DT / {String(flagshipCount).padStart(2, "0")} + {String(requestOnlyCount).padStart(2, "0")}</span>
            <span className="catalogue-dial__coordinate catalogue-dial__coordinate--b">{disciplines.length} disciplines</span>
          </div>
        </div>
        <div className="shell catalogue-hero__foot">
          <div><strong>{String(flagshipCount).padStart(2, "0")}</strong><span>Flagship products</span></div>
          <div><strong>{String(familyCount).padStart(2, "0")}</strong><span>Products within families</span></div>
          <div><strong>{String(requestOnlyCount).padStart(2, "0")}</strong><span>Request-only routes</span></div>
          <p>Full product access is qualified and issued separately.</p>
        </div>
      </section>

      <section className="catalogue-browser" id="catalogue" aria-labelledby="catalogue-browser-title" aria-busy={!urlStateReady}>
        <div className="shell">
          <div className="catalogue-browser__head">
            <div>
              <p className="t-label">The working catalogue</p>
              <h2 id="catalogue-browser-title">Choose the work.<br /><em>Inspect the tool.</em></h2>
            </div>
            <p>Search the audited records, narrow by discipline or open a product directly. The inspector shows catalogue facts—not a simulated application screen.</p>
          </div>

          <div className="catalogue-controls">
            <label className="catalogue-search">
              <span>Search the catalogue</span>
              <div>
                <Icon name="search" size={20} weight="bold" />
                <input type="search" value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Product, capability or deployment" autoComplete="off" maxLength={160} disabled={!urlStateReady} />
              </div>
            </label>
            <label className="catalogue-view">
              <span>Show</span>
              <select value={view} onChange={(event) => changeView(event.target.value as CatalogueView)} disabled={!urlStateReady}>
                {(Object.keys(viewLabels) as CatalogueView[]).map((value) => <option value={value} key={value}>{viewLabels[value]}</option>)}
              </select>
            </label>
          </div>

          <div className="catalogue-disciplines" role="group" aria-label="Filter by discipline">
            <button type="button" aria-pressed={disciplineId === "all"} onClick={() => changeDiscipline("all")} disabled={!urlStateReady}><Icon name="grid" size={16} weight="duotone" />All disciplines</button>
            {disciplines.map((discipline) => (
              <button type="button" key={discipline.id} aria-pressed={disciplineId === discipline.id} onClick={() => changeDiscipline(discipline.id)} disabled={!urlStateReady}><Icon name={disciplineIcons[discipline.id]} size={16} weight="duotone" />{discipline.label}</button>
            ))}
          </div>

          <div className="catalogue-results-bar">
            <p role="status" aria-live="polite">{urlStateReady ? `${visibleProducts.length} ${visibleProducts.length === 1 ? "record" : "records"} in view` : "Applying URL filters…"}</p>
            {hasFilters && <button type="button" onClick={resetFilters} disabled={!urlStateReady}>Reset filters<span aria-hidden="true">×</span></button>}
          </div>

          <div className="catalogue-layout">
            <div className="catalogue-records">
              {visibleProducts.length > 0 ? disciplines.map((discipline) => {
                const records = visibleProducts.filter((product) => discipline.productIds.includes(product.id));
                if (!records.length) return null;
                return (
                  <section className="catalogue-discipline" id={`discipline-${discipline.id}`} key={discipline.id} aria-labelledby={`discipline-${discipline.id}-title`}>
                    <header className="catalogue-discipline__head">
                      <Icon name={disciplineIcons[discipline.id]} size={24} weight="duotone" />
                      <div><h3 id={`discipline-${discipline.id}-title`}>{discipline.label}</h3><p>{discipline.note}</p></div>
                      <small>{String(records.length).padStart(2, "0")}</small>
                    </header>
                    <ul className="catalogue-records__list">
                      {records.map((product) => {
                        const selected = activeProduct?.id === product.id;
                        const parent = product.parentId ? products.find((item) => item.id === product.parentId) : undefined;
                        return (
                          <li key={product.id}>
                            <a
                              href={`${product.route}/`}
                              className={`catalogue-record${selected ? " catalogue-record--active" : ""}`}
                              aria-current={selected ? "true" : undefined}
                              onClick={(event) => selectProduct(event, product)}
                            >
                              <span className="catalogue-record__mark"><ProductMark product={product} size={42} /></span>
                              <strong>{product.name}</strong>
                              <span className="catalogue-record__summary">{product.summary}</span>
                              <span className="catalogue-record__meta">{parent ? `Within ${parent.name}` : product.availability === "request-only" ? "Request-only route" : product.category}</span>
                              <span className="catalogue-record__arrow"><Arrow /></span>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              }) : (
                <div className="catalogue-empty">
                  <span aria-hidden="true">00</span>
                  <h3>No matching records.</h3>
                  <p>Try a product name, a capability such as “admissions”, or reset the filters to return to the full catalogue.</p>
                  <button type="button" className="button button--primary" onClick={resetFilters} disabled={!urlStateReady}>Reset the catalogue<Arrow /></button>
                </div>
              )}
            </div>

            {activeProduct ? (
              <aside className="catalogue-inspector" aria-labelledby="inspector-title">
                <div className="catalogue-inspector__inner" key={activeProduct.id}>
                  <div className="catalogue-inspector__topline"><span>Catalogue record</span><span>{String(productIndex).padStart(2, "0")} / {String(orderedProducts.length).padStart(2, "0")}</span></div>
                  <div className="catalogue-inspector__identity">
                    <span className="catalogue-inspector__mark"><ProductMark product={activeProduct} size={64} /></span>
                    <p className="t-label">{activeDiscipline?.label}</p>
                    <h2 id="inspector-title">{activeProduct.name}</h2>
                    <p>{activeProduct.summary}</p>
                  </div>
                  <ProductSignal product={activeProduct} compact={false} />
                  <dl className="catalogue-inspector__facts">
                    <div><dt>Status</dt><dd>{activeProduct.availability === "request-only" ? "Request-only route" : activeProduct.status}</dd></div>
                    <div><dt>Buying model</dt><dd>{buyingLabels[activeProduct.buyingModel]}</dd></div>
                    <div><dt>Deployment</dt><dd>{activeProduct.deployment}</dd></div>
                    <div><dt>Platforms</dt><dd>{activeProduct.platforms.join(" · ") || "Confirm during evaluation"}</dd></div>
                  </dl>
                  {activeChildren.length > 0 && (
                    <div className="catalogue-inspector__family">
                      <p className="t-label">Within this family</p>
                      <ul>{activeChildren.map((child) => <li key={child.id}><a href={`${child.route}/`}><ProductMark product={child} size={28} /><span>{child.name}</span><Arrow /></a></li>)}</ul>
                    </div>
                  )}
                  <div className="catalogue-inspector__actions">
                    <a className="button button--primary" href={`${activeProduct.route}/`} data-cta="inspect-product">Inspect {activeProduct.name}<Arrow /></a>
                    <a className="text-link" href={productRequestHref} data-cta={productSupportsDemo ? "request-product-demo" : "request-product-interest"}>{productRequestLabel}<span aria-hidden="true">↗</span></a>
                  </div>
                  <p className="catalogue-inspector__note">{productRequestNote}</p>
                  <span className="sr-only" aria-live="polite" aria-atomic="true">{activeProduct.name} selected.</span>
                </div>
              </aside>
            ) : (
              <aside className="catalogue-inspector catalogue-inspector--empty">
                <p className="t-label">Product inspector</p>
                <h2>Select a record.</h2>
                <p>The inspector will show deployment, buying model, capabilities and the direct product route.</p>
              </aside>
            )}
          </div>
        </div>
      </section>

      <section className="catalogue-closing" aria-labelledby="catalogue-closing-title">
        <div className="shell catalogue-closing__grid">
          <div><p className="t-label">A useful first step</p><h2 id="catalogue-closing-title">Bring the workflow.<br /><em>We’ll find the fit.</em></h2></div>
          <div><p>If the catalogue feels broad, describe the work, the constraint and the outcome. We will route the conversation to the right product.</p><a className="button button--primary" href={contactHref} data-cta="request-product-guidance">Request product guidance<Arrow /></a></div>
        </div>
        <div className="catalogue-closing__word" aria-hidden="true">Digi Tracks</div>
      </section>
    </div>
  );
}
