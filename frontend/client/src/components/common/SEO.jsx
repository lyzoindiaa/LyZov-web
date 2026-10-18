import { useEffect } from "react";

const updateMetaTag = (attributeName, attributeValue, content) => {
  if (!content) return;
  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

const updateCanonicalUrl = (url) => {
  if (!url) return;
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
};

const updateJsonLd = (schemaData) => {
  const SCRIPT_ID = "lyzov-jsonld-schema";
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
  ogType = "website",
  schema,
}) => {
  useEffect(() => {
    // 1. Update Document Title
    if (title) {
      document.title = title.includes("LyZov") ? title : `${title} | LyZov`;
    }

    // 2. Update Standard Meta Description
    if (description) {
      updateMetaTag("name", "description", description);
    }

    // 3. Update Canonical Tag
    const currentCanonical = canonicalUrl || window.location.href.split("?")[0];
    updateCanonicalUrl(currentCanonical);

    // 4. Update Open Graph Tags
    const ogTitle = title || document.title;
    updateMetaTag("property", "og:title", ogTitle);
    if (description) updateMetaTag("property", "og:description", description);
    updateMetaTag("property", "og:type", ogType);
    updateMetaTag("property", "og:url", currentCanonical);
    if (ogImage) updateMetaTag("property", "og:image", ogImage);

    // 5. Update Twitter Card Tags
    updateMetaTag("name", "twitter:card", "summary_large_image");
    updateMetaTag("name", "twitter:title", ogTitle);
    if (description) updateMetaTag("name", "twitter:description", description);
    if (ogImage) updateMetaTag("name", "twitter:image", ogImage);

    // 6. Update JSON-LD Schema
    if (schema) {
      updateJsonLd(schema);
    }

    return () => {
      // Clean up JSON-LD script on unmount
      const script = document.getElementById("lyzov-jsonld-schema");
      if (script) script.remove();
    };
  }, [title, description, canonicalUrl, ogImage, ogType, schema]);

  return null;
};

export default SEO;
