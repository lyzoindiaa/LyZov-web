import { useEffect } from "react";

const updateMetaTag = (attributeName, attributeValue, content) => {
  if (!content) return;
  const elements = document.querySelectorAll(`meta[${attributeName}="${attributeValue}"]`);
  let element = elements[0];
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
  for (let i = 1; i < elements.length; i++) {
    elements[i].remove();
  }
};

const updateCanonicalUrl = (url) => {
  if (!url) return;
  const links = document.querySelectorAll('link[rel="canonical"]');
  let link = links[0];
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
  for (let i = 1; i < links.length; i++) {
    links[i].remove();
  }
};

const updateJsonLd = (schemaData) => {
  const SCRIPT_ID = "lyzov-jsonld-schema";
  const prerenderScript = document.getElementById("lyzov-prerender-schema");
  if (prerenderScript) prerenderScript.remove();

  let script = document.getElementById(SCRIPT_ID);

  if (!schemaData) {
    if (script) script.remove();
    return;
  }

  if (!script) {
    script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(schemaData);
};

/**
 * Native React 19 Head / SEO manager
 */
const SEO = ({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogImageAlt,
  ogType = "website",
  keywords,
  noIndex = false,
  schema,
}) => {
  useEffect(() => {
    // 1. Document Title
    if (title) {
      document.title = title.includes("LyZov") ? title : `${title} | LyZov`;
    }

    // 2. Meta Description & Keywords
    if (description) {
      updateMetaTag("name", "description", description);
    }
    if (keywords) {
      updateMetaTag("name", "keywords", keywords);
    }

    // 3. Robots Directive
    updateMetaTag("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");

    // 4. Canonical URL
    const currentCanonical = canonicalUrl || window.location.href.split("?")[0];
    if (!noIndex) {
      updateCanonicalUrl(currentCanonical);
    }

    // 5. Open Graph Tags
    const ogTitle = title || document.title;
    updateMetaTag("property", "og:site_name", "LyZov");
    updateMetaTag("property", "og:title", ogTitle);
    if (description) updateMetaTag("property", "og:description", description);
    updateMetaTag("property", "og:type", ogType);
    updateMetaTag("property", "og:url", currentCanonical);
    if (ogImage) {
      updateMetaTag("property", "og:image", ogImage);
      updateMetaTag("property", "og:image:alt", ogImageAlt || ogTitle);
    }

    // 6. Twitter Card Tags
    updateMetaTag("name", "twitter:card", "summary_large_image");
    updateMetaTag("name", "twitter:title", ogTitle);
    if (description) updateMetaTag("name", "twitter:description", description);
    if (ogImage) updateMetaTag("name", "twitter:image", ogImage);

    // 7. JSON-LD Schema
    updateJsonLd(schema);

    return () => {
      const script = document.getElementById("lyzov-jsonld-schema");
      if (script) script.remove();
      if (noIndex) {
        updateMetaTag("name", "robots", "index, follow");
      }
    };
  }, [title, description, canonicalUrl, ogImage, ogImageAlt, ogType, keywords, noIndex, schema]);

  return null;
};

export default SEO;
