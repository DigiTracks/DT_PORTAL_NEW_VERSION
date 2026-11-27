import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import type { PublicProductRecord } from "@digitracks/catalog";
import Icon, { type IconName } from "./Icon";
import ProductMark from "./ProductMark";

interface AtlasGroup {
  id: string;
  label: string;
  note: string;
  productIds: readonly string[];
}

type AtlasProduct = Pick<PublicProductRecord,
  "id" | "name" | "summary" | "category" | "capabilities" | "platforms" |
  "deployment" | "status" | "route" | "logo" | "installCommand"
>;

interface ProductAtlasProps {
  products: readonly AtlasProduct[];
}

const groups: readonly AtlasGroup[] = [
  {
    id: "enterprise",
    label: "Enterprise",
    note: "Connected operations, modular by design",
    productIds: [
      "unify", "nexora", "arventa", "monexa", "planora", "logistra",
      "procura", "orbitra", "workzen", "connexa"
    ]
  },
  {
    id: "procurement",
    label: "Procurement",
    note: "Source, control, verify and realise value",
    productIds: [
      "vertex", "procure5", "procureleak", "tenderguard", "contractleak",
      "procuredecision", "procureoutcomes", "vantor", "sherpa", "quote-simulator"
    ]
  },
  {
    id: "education",
    label: "Education",
    note: "Campus life, academics and placement",
    productIds: [
      "vedik", "vedik-school-erp", "unnati", "vedik-university", "vedik-social",
      "campus-grid", "mindone", "mindone-pro"
    ]
  },
  {
    id: "people",
    label: "People & care",
    note: "Clinical, workforce and studio operations",
    productIds: ["chronos", "nipuna", "glowra"]
  },
  {
    id: "engineering",
    label: "Engineering",
    note: "Code intelligence, security and delivery",
    productIds: ["orion", "orion-hunter", "opspilot", "recon"]
  },
  {
    id: "field",
    label: "Field operations",
    note: "Projects, sites, fleets and freight",
    productIds: ["construction", "transportation"]
  }
];

interface AtlasState {
  groupId: string;
  productId: string;
}

const groupIcons: Record<string, IconName> = {
  enterprise: "layers",
  procurement: "flow",
  education: "education",
  people: "users",
  engineering: "code",
  field: "map"
};

function groupProducts(group: AtlasGroup, products: readonly AtlasProduct[]) {
  return group.productIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is AtlasProduct => Boolean(product));
}

function readAtlasState(params: URLSearchParams, products: readonly AtlasProduct[]): AtlasState {
  const requestedGroupId = params.get("atlas");
  const requestedProductId = params.get("atlas-product");
  const productGroup = requestedProductId
    ? groups.find((group) => group.productIds.includes(requestedProductId))
    : undefined;
  const group = groups.find((candidate) => candidate.id === requestedGroupId) ?? productGroup ?? groups[1];
  const nextProducts = groupProducts(group, products);
  return {
    groupId: group.id,
    productId: requestedProductId && nextProducts.some((product) => product.id === requestedProductId)
      ? requestedProductId
      : nextProducts[0]?.id ?? ""
  };
}

function writeAtlasUrl(state: AtlasState, mode: "push" | "replace") {
  const url = new URL(window.location.href);
  if (state.productId) {
    url.searchParams.set("atlas", state.groupId);
    url.searchParams.set("atlas-product", state.productId);
  } else {
    url.searchParams.delete("atlas");
    url.searchParams.delete("atlas-product");
  }
  if (url.href !== window.location.href) window.history[mode === "push" ? "pushState" : "replaceState"](window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

export default function ProductAtlas({ products }: ProductAtlasProps) {
  const [activeGroupId, setActiveGroupId] = useState(groups[1].id);
  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? groups[1];
  const currentGroupProducts = groupProducts(activeGroup, products);
  const [activeProductId, setActiveProductId] = useState(currentGroupProducts[0]?.id ?? "");
  const [urlStateReady, setUrlStateReady] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const activeProduct = currentGroupProducts.find((product) => product.id === activeProductId) ?? currentGroupProducts[0];

  const applyUrlState = useCallback((params: URLSearchParams) => {
    const next = readAtlasState(params, products);
    setActiveGroupId(next.groupId);
    setActiveProductId(next.productId);
    setShowAll(false);
    return next;
  }, [products]);

  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("atlas") || params.has("atlas-product")) {
      writeAtlasUrl(applyUrlState(params), "replace");
    }
    setUrlStateReady(true);
  }, [applyUrlState]);

  useEffect(() => {
    if (!urlStateReady) return;
    function restoreFromHistory() {
      applyUrlState(new URLSearchParams(window.location.search));
    }
    window.addEventListener("popstate", restoreFromHistory);
    return () => window.removeEventListener("popstate", restoreFromHistory);
  }, [applyUrlState, urlStateReady]);

  function chooseGroup(group: AtlasGroup) {
    const nextProducts = groupProducts(group, products);
    const next = { groupId: group.id, productId: nextProducts[0]?.id ?? "" };
    setActiveGroupId(next.groupId);
    setActiveProductId(next.productId);
    setShowAll(false);
    writeAtlasUrl(next, "push");
  }

  function chooseProduct(productId: string) {
    if (!activeGroup.productIds.includes(productId)) return;
    setActiveProductId(productId);
    writeAtlasUrl({ groupId: activeGroup.id, productId }, "push");
  }

  if (!activeProduct) return null;

  return (
    <div className="product-atlas" data-atlas aria-busy={!urlStateReady}>
      <div className="product-atlas__rail" role="group" aria-label="Product categories">
        {groups.map((group, index) => {
          const selected = group.id === activeGroup.id;
          return (
            <button
              key={group.id}
              type="button"
              className="product-atlas__category"
              aria-pressed={selected}
              onClick={() => chooseGroup(group)}
              disabled={!urlStateReady}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span className="product-atlas__category-icon"><Icon name={groupIcons[group.id]} size={22} weight="duotone" /></span>
              <strong>{group.label}</strong>
              <small>{group.note}</small>
            </button>
          );
        })}
      </div>

      <div className="product-atlas__products" role="group" aria-label={`${activeGroup.label} products`}>
        <div className="product-atlas__section-label">
          <span>{activeGroup.label}</span>
          <span>{String(currentGroupProducts.length).padStart(2, "0")} records</span>
        </div>
        {(showAll ? currentGroupProducts : currentGroupProducts.slice(0, 6)).map((product, index) => {
          const selected = product.id === activeProduct.id;
          return (
            <button
              key={product.id}
              type="button"
              className="product-atlas__product"
              aria-pressed={selected}
              onClick={() => chooseProduct(product.id)}
              disabled={!urlStateReady}
            >
              <span className="product-atlas__product-index">{String(index + 1).padStart(2, "0")}</span>
              <ProductMark product={product} size={38} />
              <span title={product.summary}>
                <strong title={product.name}>{product.name}</strong>
                <small>{product.summary}</small>
              </span>
              <span className="product-atlas__product-status">{product.status}</span>
            </button>
          );
        })}
        {currentGroupProducts.length > 6 && !showAll && (
          <button type="button" className="product-atlas__more" onClick={() => setShowAll(true)}>
            Show all {currentGroupProducts.length} {activeGroup.label.toLowerCase()} records
            <span aria-hidden="true">↓</span>
          </button>
        )}
      </div>

      <div className="product-atlas__detail" key={activeProduct.id} aria-live="polite">
        <div className="product-atlas__detail-head">
          <span>Catalogue record</span>
          <span>{activeProduct.category}</span>
        </div>
        <ul className="product-atlas__caps" aria-label={`${activeProduct.name} selected capabilities`}>
          {activeProduct.capabilities.slice(0, 4).map((capability, index) => (
            <li key={capability}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              {capability}
            </li>
          ))}
        </ul>
        <div className="product-atlas__detail-copy">
          <p className="t-label">{activeProduct.status}</p>
          <h3>{activeProduct.name}</h3>
          <p>{activeProduct.summary}</p>
          <dl>
            <div><dt>Deployment</dt><dd>{activeProduct.deployment}</dd></div>
            <div><dt>Platforms</dt><dd>{activeProduct.platforms.join(" · ")}</dd></div>
          </dl>
          <a className="text-link" href={`${activeProduct.route}/`}>Inspect {activeProduct.name}<span aria-hidden="true">↗</span></a>
        </div>
        <div className="product-atlas__also">
          <p className="t-label">Also in {activeGroup.label}</p>
          <ul>
            {currentGroupProducts.filter((product) => product.id !== activeProduct.id).slice(0, 3).map((product) => (
              <li key={product.id}>
                <button type="button" onClick={() => chooseProduct(product.id)}>
                  {product.name}
                  <span aria-hidden="true">↗</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
