import { useEffect } from "react";

/**
 * Client-side head manager for routes where `head()` cannot vary by
 * search params (ssr:false SPA routes). Injects/updates canonical,
 * hreflang, robots and JSON-LD tags on the live <head>.
 *
 * Tags are tagged with data-dyn="1" so we can safely replace them.
 */
export type DynamicSeoInput = {
  canonical: string;
  hreflang?: { th: string; en: string; xDefault: string };
  robots?: string;
  prev?: string | null;
  next?: string | null;
  jsonLd?: unknown[];
};

const MARK = "data-dyn-seo";

function replaceLink(rel: string, href: string, extra: Record<string, string> = {}) {
  const sel = `link[${MARK}][rel="${rel}"]${extra.hrefLang ? `[hreflang="${extra.hrefLang}"]` : ""}`;
  document.head.querySelectorAll(sel).forEach((n) => n.remove());
  const el = document.createElement("link");
  el.setAttribute(MARK, "1");
  el.rel = rel;
  el.href = href;
  for (const [k, v] of Object.entries(extra)) el.setAttribute(k === "hrefLang" ? "hreflang" : k, v);
  document.head.appendChild(el);
}

function replaceMetaName(name: string, content: string) {
  document.head.querySelectorAll(`meta[${MARK}][name="${name}"]`).forEach((n) => n.remove());
  const el = document.createElement("meta");
  el.setAttribute(MARK, "1");
  el.name = name;
  el.content = content;
  document.head.appendChild(el);
}

function clearAllJsonLd() {
  document.head.querySelectorAll(`script[${MARK}][type="application/ld+json"]`).forEach((n) => n.remove());
}

function addJsonLd(obj: unknown) {
  const el = document.createElement("script");
  el.setAttribute(MARK, "1");
  el.type = "application/ld+json";
  el.textContent = JSON.stringify(obj);
  document.head.appendChild(el);
}

export function useDynamicSeo(input: DynamicSeoInput | null) {
  useEffect(() => {
    if (!input) return;
    // Remove prior dynamic tags managed by this hook.
    document.head.querySelectorAll(`[${MARK}]`).forEach((n) => n.remove());
    // Also override the static canonical from route head() by removing any existing canonical.
    document.head.querySelectorAll(`link[rel="canonical"]:not([${MARK}])`).forEach((n) => n.remove());

    replaceLink("canonical", input.canonical);
    if (input.hreflang) {
      replaceLink("alternate", input.hreflang.th, { hrefLang: "th" });
      replaceLink("alternate", input.hreflang.en, { hrefLang: "en" });
      replaceLink("alternate", input.hreflang.xDefault, { hrefLang: "x-default" });
    }
    if (input.prev) replaceLink("prev", input.prev);
    if (input.next) replaceLink("next", input.next);
    if (input.robots) replaceMetaName("robots", input.robots);
    if (input.jsonLd?.length) {
      clearAllJsonLd();
      for (const j of input.jsonLd) addJsonLd(j);
    }
    return () => {
      document.head.querySelectorAll(`[${MARK}]`).forEach((n) => n.remove());
    };
  }, [JSON.stringify(input)]);
}

export function getRobotsForCategory(filters: {
  q?: string;
  category?: string;
  brands?: string;
  min?: number;
  max?: number;
  page?: number;
  priceMax: number;
}): string {
  const hasFilterExtras =
    !!filters.q ||
    !!filters.brands ||
    (typeof filters.min === "number" && filters.min > 0) ||
    (typeof filters.max === "number" && filters.max < filters.priceMax);
  if (hasFilterExtras) return "noindex, follow";
  return "index, follow";
}
