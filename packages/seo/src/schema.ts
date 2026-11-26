export interface BreadcrumbItem {
  name: string;
  item: string;
}

export function breadcrumbSchema(items: readonly BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.item
    }))
  };
}

export function webSiteSchema(name: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url
  };
}
