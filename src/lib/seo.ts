import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const SITE_URL = "https://velmonts.vercel.app";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/favicon-watch.png`;

interface SEOOptions {
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
  structuredData?: object | object[];
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

// Updates document.title, description/robots/canonical/OG/Twitter meta, and
// an optional per-route JSON-LD block on every route change. This is a CSR
// app with no SSR, so these only reach crawlers that execute JS (Googlebot
// does); index.html carries static fallbacks for everyone else.
export function useSEO({ title, description, image, noindex, structuredData }: SEOOptions) {
  const location = useLocation();
  const structuredDataKey = structuredData ? JSON.stringify(structuredData) : null;

  useEffect(() => {
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    const url = `${SITE_URL}${location.pathname}`;
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    const ogImage = image ?? DEFAULT_OG_IMAGE;
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", ogImage);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", ogImage);

    const scriptId = "route-jsonld";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (structuredDataKey) {
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = structuredDataKey;
    } else if (script) {
      script.remove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, image, noindex, location.pathname, structuredDataKey]);
}
