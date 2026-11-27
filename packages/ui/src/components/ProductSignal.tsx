import { useId } from "react";
import type { PublicProductRecord } from "@digitracks/catalog";
import Icon, { type IconName } from "./Icon";
import ProductMark from "./ProductMark";

type SignalProduct = Pick<PublicProductRecord, "id" | "name" | "category" | "logo" | "capabilities" | "installCommand">;

interface ProductSignalProps {
  product: SignalProduct;
  compact?: boolean;
  labels?: boolean;
  className?: string;
}

const capabilityIconRules: readonly (readonly [RegExp, IconName])[] = [
  [/\b(quote|normalis|normaliz|comparable|currency|terms)\b/i, "scales"],
  [/\b(npv|tco|cost|price|pricing|budget|financial|finance|saving|savings)\b/i, "calculator"],
  [/\b(sensitivity|switching|scenario|assumption|parametric|what.if)\b/i, "sliders"],
  [/\b(scorecard|score|scored|weighted|criteria|evaluation|ranking)\b/i, "scorecard"],
  [/\b(approval|approve|signature|sign.off)\b/i, "approval"],
  [/\b(search|discover|index|catalogue|catalog|lookup)\b/i, "search"],
  [/\b(audit|compliance|control|risk|integrity|fair|security|identity|permission|access)\b/i, "shield"],
  [/\b(analytic|analysis|report|insight|metric|variance|trend|benchmark)\b/i, "chart"],
  [/\b(workflow|process|orchestrat|pipeline|route|routing|flow)\b/i, "flow"],
  [/\b(integrat|connect|api|sync|webhook|dependency|dependencies)\b/i, "graph"],
  [/\b(monitor|status|uptime|performance|health|telemetry|alert)\b/i, "gauge"],
  [/\b(schedule|calendar|deadline|time|attendance|shift)\b/i, "clock"],
  [/\b(document|content|source|evidence|brief|record|library|knowledge)\b/i, "document"],
  [/\b(data|database|storage|ledger|baseline)\b/i, "database"],
  [/\b(employee|people|team|talent|candidate|hr|workforce)\b/i, "users"],
  [/\b(learn|training|study|skill|education|course|assessment)\b/i, "education"],
  [/\b(ai|intelligence|automat|machine|model|prediction)\b/i, "brain"],
  [/\b(patient|clinical|care|medical)\b/i, "health"],
  [/\b(project|plan|milestone|task)\b/i, "path"],
  [/\b(deploy|install|package|release|migration|migrate)\b/i, "package"],
];

function capabilityIcon(capability: string): IconName {
  return capabilityIconRules.find(([pattern]) => pattern.test(capability))?.[1] ?? "check";
}

function visualKind(product: SignalProduct) {
  if (product.installCommand) return "terminal";
  if (product.id === "vertex" || product.id === "procure5") return "flow";
  if (product.category.toLowerCase().includes("engineering")) return "matrix";
  if (product.category.toLowerCase().includes("hr") || product.category.toLowerCase().includes("health")) return "pipeline";
  if (product.category.toLowerCase().includes("education") || product.category.toLowerCase().includes("enterprise")) return "orbit";
  return "matrix";
}

export default function ProductSignal({ product, compact = false, labels = true, className }: ProductSignalProps) {
  const id = useId().replaceAll(":", "");
  const kind = visualKind(product);
  const capabilities = product.capabilities.slice(0, 4);
  const accessibleLabel = `${product.name} catalogue-derived capability architecture: ${capabilities.join("; ")}`;

  return (
    <div
      className={["product-signal", `product-signal--${kind}`, compact ? "product-signal--compact" : "", className].filter(Boolean).join(" ")}
      role="img"
      aria-label={accessibleLabel}
    >
      <div className="product-signal__field" aria-hidden="true" />
      <svg className="product-signal__wiring" viewBox="0 0 600 380" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`${id}-line`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--signal)" stopOpacity="0.15" />
            <stop offset="0.5" stopColor="var(--signal)" stopOpacity="0.85" />
            <stop offset="1" stopColor="var(--blue)" stopOpacity="0.25" />
          </linearGradient>
        </defs>
        {kind === "flow" ? (
          <>
            <path d="M80 190H520" stroke={`url(#${id}-line)`} strokeWidth="2" />
            {[80, 226, 374, 520].map((x) => <circle key={x} cx={x} cy="190" r="7" fill="var(--night)" stroke="var(--signal)" strokeWidth="2" />)}
          </>
        ) : kind === "pipeline" ? (
          <>
            <path d="M90 95H510M90 190H510M90 285H510" stroke={`url(#${id}-line)`} strokeWidth="2" />
            {[90, 230, 370, 510].map((x, index) => <circle key={x} cx={x} cy={[95, 285, 190, 95][index]} r="7" fill="var(--night)" stroke="var(--signal)" strokeWidth="2" />)}
          </>
        ) : (
          <>
            <path d="M300 190 105 82M300 190 495 82M300 190 105 298M300 190 495 298" stroke={`url(#${id}-line)`} strokeWidth="1.5" />
            <circle cx="300" cy="190" r="104" fill="none" stroke="var(--signal)" strokeOpacity="0.16" />
            <circle cx="300" cy="190" r="142" fill="none" stroke="var(--signal)" strokeOpacity="0.08" strokeDasharray="3 12" />
          </>
        )}
      </svg>

      <div className="product-signal__core" aria-hidden="true">
        <ProductMark product={product} size={compact ? 48 : 64} />
        <span>{product.name}</span>
      </div>

      {kind === "terminal" ? (
        <div className="product-signal__terminal" aria-hidden="true">
          <div><span></span><span></span><span></span><small>verified install route</small></div>
          <code>{product.installCommand}</code>
          <p><span>›</span>{product.capabilities[0]}</p>
        </div>
      ) : (
        <div className="product-signal__nodes" aria-hidden="true">
          {capabilities.map((capability, index) => {
            const icon = capabilityIcon(capability);
            return (
              <div className={`product-signal__node product-signal__node--${index + 1}`} data-capability-icon={icon} key={capability}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span className="product-signal__icon"><Icon name={icon} size={compact ? 15 : 17} weight="regular" /></span>
                {labels && !compact && <strong>{capability}</strong>}
              </div>
            );
          })}
        </div>
      )}

      <div className="product-signal__caption" aria-hidden="true">
        <span>{product.id.toUpperCase()} / CAPABILITY MAP</span>
        <span>CATALOGUE-DERIVED · NOT A SCREENSHOT</span>
      </div>
    </div>
  );
}
