export interface HeadMeta {
  title: string;
  description: string;
  canonical?: string;
  indexable?: boolean;
  ogImage?: string;
  ogImageAlt?: string;
  siteName?: string;
  type?: "website" | "article" | "profile";
}

export interface HeadField {
  name: "title" | "meta" | "link";
  key?: string;
  content?: string;
  rel?: string;
  href?: string;
}

export function buildHeadFields(meta: HeadMeta): HeadField[] {
  const indexable = meta.indexable ?? true;
  const fields: HeadField[] = [
    { name: "title", content: meta.title },
    { name: "meta", key: "description", content: meta.description },
    { name: "meta", key: "robots", content: indexable ? "index, follow" : "noindex, follow" }
  ];

  if (!indexable) return fields;

  if (meta.canonical) fields.push({ name: "link", rel: "canonical", href: meta.canonical });
  fields.push(
    { name: "meta", key: "og:type", content: meta.type ?? "website" },
    { name: "meta", key: "og:title", content: meta.title },
    { name: "meta", key: "og:description", content: meta.description }
  );

  if (meta.siteName) fields.push({ name: "meta", key: "og:site_name", content: meta.siteName });
  if (meta.canonical) fields.push({ name: "meta", key: "og:url", content: meta.canonical });
  if (meta.ogImage) {
    fields.push(
      { name: "meta", key: "og:image", content: meta.ogImage },
      { name: "meta", key: "og:image:width", content: "1200" },
      { name: "meta", key: "og:image:height", content: "630" },
      { name: "meta", key: "og:image:alt", content: meta.ogImageAlt ?? meta.title },
      { name: "meta", key: "twitter:card", content: "summary_large_image" },
      { name: "meta", key: "twitter:title", content: meta.title },
      { name: "meta", key: "twitter:description", content: meta.description },
      { name: "meta", key: "twitter:image", content: meta.ogImage }
    );
  }

  return fields;
}
