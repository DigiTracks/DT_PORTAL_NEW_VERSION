import type { ProductRecord } from "@digitracks/catalog";

interface ProductMarkProps {
  product: Pick<ProductRecord, "id" | "name" | "category" | "logo">;
  size?: number;
  className?: string;
}

function hashProduct(value: string) {
  return [...value].reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0, 0);
}

function toneFor(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("procure") || normalized.includes("security") || normalized.includes("engineering")) return "signal";
  if (normalized.includes("education") || normalized.includes("project") || normalized.includes("logistics") || normalized.includes("construction")) return "blue";
  if (normalized.includes("health") || normalized.includes("hr") || normalized.includes("wellness")) return "paper";
  return "signal";
}

export default function ProductMark({ product, size = 42, className }: ProductMarkProps) {
  if (product.logo) {
    return (
      <img
        className={["product-mark", "product-mark--official", className].filter(Boolean).join(" ")}
        src={product.logo}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    );
  }

  const hash = Math.abs(hashProduct(product.id));
  const variant = hash % 8;
  const tone = toneFor(product.category);
  const initials = product.id === "procure5"
    ? "P5"
    : product.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("");

  return (
    <svg
      className={["product-mark", `product-mark--${tone}`, className].filter(Boolean).join(" ")}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="1" width="62" height="62" rx="2" fill="currentColor" fillOpacity="0.035" stroke="currentColor" strokeOpacity="0.28" />
      {variant === 0 && (
        <>
          <path d="M15 17h8v30h-8zM27 17h8v30h-8zM39 17h10L37 47V17Z" fill="currentColor" />
          <path d="M12 50h40" stroke="var(--mark-accent)" strokeWidth="2" />
        </>
      )}
      {variant === 1 && (
        <>
          <path d="m32 11 17 10v22L32 53 15 43V21l17-10Z" stroke="currentColor" strokeWidth="2" />
          <path d="m32 19 10 6v14l-10 6-10-6V25l10-6Z" fill="var(--mark-accent)" fillOpacity="0.8" />
          <path d="M22 42 43 21" stroke="currentColor" strokeWidth="2" />
        </>
      )}
      {variant === 2 && (
        <>
          <ellipse cx="32" cy="32" rx="21" ry="10" transform="rotate(-35 32 32)" stroke="currentColor" strokeWidth="2" />
          <ellipse cx="32" cy="32" rx="21" ry="10" transform="rotate(35 32 32)" stroke="var(--mark-accent)" strokeWidth="2" />
          <circle cx="32" cy="32" r="5" fill="currentColor" />
          <circle cx="48" cy="18" r="3" fill="var(--mark-accent)" />
        </>
      )}
      {variant === 3 && (
        <>
          <path d="M13 18h16v9H13zM35 18h16v9H35zM13 37h16v9H13zM35 37h16v9H35z" stroke="currentColor" strokeWidth="2" />
          <path d="M29 22h6M22 27v10M42 27v10M29 41h6" stroke="var(--mark-accent)" strokeWidth="2" />
          <rect x="29" y="29" width="6" height="6" fill="var(--mark-accent)" />
        </>
      )}
      {variant === 4 && (
        <>
          <path d="M12 18h16l8 8v20H28l-8-8V18Z" stroke="currentColor" strokeWidth="2" />
          <path d="M28 18v14h12M20 32h16M28 46l8-8" stroke="var(--mark-accent)" strokeWidth="2" />
          <circle cx="44" cy="18" r="4" fill="var(--mark-accent)" />
        </>
      )}
      {variant === 5 && (
        <>
          <path d="m32 10 20 12-20 12-20-12 20-12Z" stroke="currentColor" strokeWidth="2" />
          <path d="m12 31 20 12 20-12M12 40l20 12 20-12" stroke="var(--mark-accent)" strokeWidth="2" />
          <path d="m32 22 9 5-9 5-9-5 9-5Z" fill="currentColor" />
        </>
      )}
      {variant === 6 && (
        <>
          <path d="M14 14h36v36H14zM14 26h36M26 14v36M38 14v36" stroke="currentColor" strokeWidth="1.5" />
          <path d="m20 44 12-18 12 18H20Z" fill="var(--mark-accent)" fillOpacity="0.85" />
        </>
      )}
      {variant === 7 && (
        <>
          <path d="M11 36h9l6-15 9 27 7-19 4 7h7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
          <path d="M11 48h42" stroke="var(--mark-accent)" strokeWidth="2" />
          <circle cx="20" cy="36" r="3" fill="var(--mark-accent)" />
          <circle cx="46" cy="36" r="3" fill="var(--mark-accent)" />
        </>
      )}
      <text x="49" y="54" fill="currentColor" fillOpacity="0.6" fontFamily="var(--font-mono)" fontSize="7" textAnchor="end">{initials}</text>
    </svg>
  );
}
