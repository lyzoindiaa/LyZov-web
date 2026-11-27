const fs = require("fs");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Review = require("../models/Review");

let cachedHtml = null;
let lastMtime = 0;

const SOCIAL_LINKS = [
  { label: "Facebook", url: "https://www.facebook.com/LyZov/" },
  { label: "Instagram", url: "https://www.instagram.com/lyzovindia/" },
  { label: "YouTube", url: "https://www.youtube.com/@lyzovindia" },
  { label: "X", url: "https://x.com/LyZovIndia" },
];

const DEFAULT_CATEGORIES = [
  { slug: "accessories", name: "Accessories" },
  { slug: "accessories-showpiece-and-figurine-god-idol", name: "God Idol" },
  { slug: "accessories-fitness-accessories", name: "Fitness Accessories" },
  { slug: "electronics-battery-oprated", name: "Battery Operated" },
  { slug: "accessories-showpiece-and-figurine", name: "Showpiece & Figurine" },
  { slug: "accessories-car-accessories", name: "Car Accessories" },
  { slug: "electronics", name: "Electronics" },
  { slug: "men", name: "Men" },
];

const POLICY_META = {
  "privacy-policy": {
    title: "Privacy Policy — Official Policy | LyZov",
    heading: "Privacy Policy",
    description:
      "Read the official Privacy Policy for LyZov. Learn how we protect customer data with 256-bit SSL encryption and transparent privacy controls.",
  },
  "terms-and-conditions": {
    title: "Terms & Conditions — Official Policy | LyZov",
    heading: "Terms & Conditions",
    description:
      "Review LyZov's official Terms & Conditions covering transparent pricing, authentic products, order acceptance, and customer guidelines across India.",
  },
  "return-exchange-policy": {
    title: "Return & Exchange Policy — 7-Day Replacement | LyZov",
    heading: "Return & Exchange Policy",
    description:
      "Learn about LyZov's 7-day replacement window, doorstep pickup, and straightforward return and exchange support across India.",
  },
  "refund-cancellation-policy": {
    title: "Refund & Cancellation Policy | LyZov",
    heading: "Refund & Cancellation Policy",
    description:
      "Read LyZov's Refund & Cancellation Policy for pre-dispatch cancellations, refund timelines (5-7 business days), and failed transaction resolution.",
  },
  "shipping-delivery-policy": {
    title: "Shipping & Delivery Policy — Pan-India Coverage | LyZov",
    heading: "Shipping & Delivery Policy",
    description:
      "Fast & reliable delivery, 24-48 hour dispatch, and tracked Pan-India delivery across 19,000+ pincodes on LyZov.",
  },
};

const POLICY_LINKS = [
  { path: "/policies/privacy-policy", label: "Privacy Policy" },
  { path: "/policies/terms-and-conditions", label: "Terms & Conditions" },
  { path: "/policies/return-exchange-policy", label: "Return & Exchange Policy" },
  { path: "/policies/refund-cancellation-policy", label: "Refund & Cancellation Policy" },
  { path: "/policies/shipping-delivery-policy", label: "Shipping & Delivery Policy" },
];

const getIndexHtml = (indexHtmlPath) => {
  try {
    const stats = fs.statSync(indexHtmlPath);
    if (!cachedHtml || stats.mtimeMs > lastMtime) {
      cachedHtml = fs.readFileSync(indexHtmlPath, "utf8");
      lastMtime = stats.mtimeMs;
    }
    return cachedHtml;
  } catch {
    return null;
  }
};

const getBaseUrl = () => {
  const rawBaseUrl = process.env.CLIENT_URL || "https://www.lyzov.com";
  return rawBaseUrl.replace(/\/+$/, "");
};

const escapeHtml = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const optimizeCloudinaryUrl = (url, width = 400) => {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  if (url.includes("/upload/f_auto") || url.includes("/upload/q_auto")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_limit/`);
};

const safeJsonLdString = (data) => JSON.stringify(data, null, 2).replace(/</g, "\\u003c");

const formatInr = (value) => {
  const num = Number(value) || 0;
  return `₹${num.toLocaleString("en-IN")}`;
};

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

const stripExistingDynamicHeadTags = (html) =>
  html
    .replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+[^>]*name=["']robots["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+[^>]*name=["']keywords["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+[^>]*property=["']og:(type|title|description|image|image:alt|url)["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+[^>]*name=["']twitter:(card|title|description|image)["'][^>]*>\s*/gi, "")
    .replace(/<script\s+[^>]*id=["']lyzov-prerender-schema["'][^>]*>[\s\S]*?<\/script>\s*/gi, "");

const renderPrerenderShell = ({
  heading,
  lead,
  breadcrumbs = [],
  categories = DEFAULT_CATEGORIES,
  products = [],
  detailHtml = "",
  extraNavHtml = "",
}) => {
  const catList = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const breadcrumbHtml =
    breadcrumbs.length > 0
      ? `<nav aria-label="Breadcrumb" class="boot-breadcrumbs">${breadcrumbs
          .map((item, idx) =>
            item.href && idx < breadcrumbs.length - 1
              ? `<a href="${escapeHtml(item.href)}">${escapeHtml(item.name)}</a> <span>/</span>`
              : `<span>${escapeHtml(item.name)}</span>`
          )
          .join(" ")}</nav>`
      : "";

  const categoryLinksHtml = catList
    .slice(0, 12)
    .filter((c) => c?.slug && c?.name)
    .map((cat) => `<a href="/category/${encodeURIComponent(cat.slug)}">${escapeHtml(cat.name)}</a>`)
    .join("");

  const productListHtml =
    products.length > 0
      ? `<section class="boot-section">
          <h2>Featured Catalog Products</h2>
          <div class="boot-grid">
            ${products
              .filter((p) => p?.slug && p?.title)
              .map((prod) => {
                const effPrice = prod.discountPrice > 0 ? prod.discountPrice : prod.price;
                const thumb = optimizeCloudinaryUrl(prod.images?.[0]?.url, 320) || "/lyzov-logo.webp";
                return `<article class="boot-card">
                  <a href="/product/${encodeURIComponent(prod.slug)}">
                    <img src="${escapeHtml(thumb)}" alt="${escapeHtml(prod.title)}" width="160" height="160" loading="lazy" />
                    <h3>${escapeHtml(prod.title)}</h3>
                    <p>${escapeHtml(formatInr(effPrice))}</p>
                  </a>
                </article>`;
              })
              .join("")}
          </div>
        </section>`
      : "";

  const policyLinksHtml = POLICY_LINKS.map(
    (p) => `<a href="${escapeHtml(p.path)}">${escapeHtml(p.label)}</a>`
  ).join(" · ");

  const socialLinksHtml = SOCIAL_LINKS.map(
    (s) =>
      `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.label)}</a>`
  ).join(" · ");

  return `<div class="boot-shell">
    <header class="boot-header">
      <div class="boot-container">
        <a href="/" class="boot-brand">Ly<span>Zov</span></a>
        <nav aria-label="Primary Navigation" class="boot-nav">
          <a href="/">Home</a>
          <a href="/shop">Shop All Products</a>
          <a href="/track">Track Order</a>
          <a href="/contact">Contact Support</a>
          <a href="/dashboard">Account</a>
        </nav>
      </div>
    </header>
    <main class="boot-main">
      ${breadcrumbHtml}
      <section class="boot-hero">
        <h1>${escapeHtml(heading)}</h1>
        ${lead ? `<p>${escapeHtml(lead)}</p>` : ""}
      </section>
      ${detailHtml}
      ${extraNavHtml}
      <nav aria-label="Shop Categories" class="boot-section">
        <h2>Shop by Category</h2>
        <div class="boot-links">${categoryLinksHtml}</div>
      </nav>
      ${productListHtml}
    </main>
    <footer class="boot-footer">
      <div class="boot-container boot-footer-inner">
        <div>
          <strong>LyZov — India's Trusted Online Shopping Platform</strong>
          <nav aria-label="Footer Store Links" class="boot-footer-links">
            <a href="/shop">All Products</a> ·
            <a href="/shop?sort=popular">Popular Collection</a> ·
            <a href="/track">Track Order</a> ·
            <a href="/contact">Customer Support</a> ·
            ${policyLinksHtml}
          </nav>
        </div>
        <div class="boot-social-links">
          Follow LyZov: ${socialLinksHtml}
        </div>
      </div>
    </footer>
  </div>`;
};

const injectRootBody = (html, bodyHtml) => {
  if (!bodyHtml) return html;
  const markerRegex = /<!--PRERENDER_BODY_START-->[\s\S]*?<!--PRERENDER_BODY_END-->/;
  if (markerRegex.test(html)) {
    return html.replace(
      markerRegex,
      `<!--PRERENDER_BODY_START-->\n${bodyHtml}\n<!--PRERENDER_BODY_END-->`
    );
  }
  return html.replace(/<div\s+id=["']root["']\s*><\/div>/i, `<div id="root">${bodyHtml}</div>`);
};

const applySeoToHtml = (
  template,
  {
    title,
    description,
    canonicalUrl,
    robots = "index, follow",
    ogType = "website",
    ogImage,
    ogImageAlt,
    keywords = "",
    jsonLd = null,
    bodyHtml = "",
  }
) => {
  const baseUrl = getBaseUrl();
  const resolvedTitle = title || "LyZov — India's Trusted Online Shopping Platform";
  const resolvedDesc =
    description ||
    "Discover a wide selection of curated, quality-checked products on LyZov. Enjoy secure online shopping, direct pricing, and safe Pan-India delivery.";
  const resolvedCanonical = canonicalUrl || baseUrl;
  const resolvedOgImage = ogImage || `${baseUrl}/lyzov-logo.png`;
  const resolvedOgAlt = ogImageAlt || resolvedTitle;

  let html = stripExistingDynamicHeadTags(template);

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(resolvedTitle)}</title>`);

  if (/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(
      /<meta\s+name=["']description["'][^>]*>/i,
      `<meta name="description" content="${escapeHtml(resolvedDesc)}" />`
    );
  } else {
    html = html.replace(
      "</head>",
      `  <meta name="description" content="${escapeHtml(resolvedDesc)}" />\n</head>`
    );
  }

  const jsonLdScript = jsonLd
    ? `\n    <script type="application/ld+json" id="lyzov-prerender-schema">\n${safeJsonLdString(
        jsonLd
      )}\n    </script>`
    : "";

  const runtimeGscToken = (process.env.GSC_VERIFICATION_TOKEN || process.env.VITE_GSC_VERIFICATION || "").trim();
  const hasGscMeta = /<meta\s+[^>]*name=["']google-site-verification["'][^>]*>/i.test(html);
  const gscMetaTag =
    !hasGscMeta && runtimeGscToken && runtimeGscToken !== "GSC_VERIFICATION_TOKEN"
      ? `\n    <meta name="google-site-verification" content="${escapeHtml(runtimeGscToken)}" />`
      : "";

  const metaTagsToInject = `
    <!-- LyZov Dynamic SEO & OpenGraph -->
    <meta name="robots" content="${escapeHtml(robots)}" />${gscMetaTag}
    <link rel="canonical" href="${escapeHtml(resolvedCanonical)}" />
    <meta property="og:type" content="${escapeHtml(ogType)}" />
    <meta property="og:title" content="${escapeHtml(resolvedTitle)}" />
    <meta property="og:description" content="${escapeHtml(resolvedDesc)}" />
    <meta property="og:image" content="${escapeHtml(resolvedOgImage)}" />
    <meta property="og:image:alt" content="${escapeHtml(resolvedOgAlt)}" />
    <meta property="og:url" content="${escapeHtml(resolvedCanonical)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(resolvedTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(resolvedDesc)}" />
    <meta name="twitter:image" content="${escapeHtml(resolvedOgImage)}" />
    ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}" />` : ""}${jsonLdScript}
  `;

  html = html.replace("</head>", `${metaTagsToInject}\n</head>`);
  html = injectRootBody(html, bodyHtml);
  return html;
};

const buildItemListSchema = ({ baseUrl, canonicalUrl, name, description, products = [] }) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${canonicalUrl}#collection`,
  name,
  description,
  url: canonicalUrl,
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((prod, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${baseUrl}/product/${encodeURIComponent(prod.slug)}`,
      name: prod.title,
    })),
  },
});

const fetchTopCategories = async () => {
  if (!isDbConnected()) return DEFAULT_CATEGORIES;
  try {
    const cats = await Category.find({ isActive: { $ne: false } })
      .select("name slug level description parent ancestors")
      .sort("displayOrder name")
      .limit(24)
      .maxTimeMS(3000)
      .lean();
    return cats.length > 0 ? cats : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
};

const fetchCatalogProducts = async (filter = {}, sort = "-isFeatured -numSold -createdAt", limit = 24) => {
  if (!isDbConnected()) return [];
  try {
    return await Product.find({
      isActive: { $ne: false },
      moderationStatus: { $nin: ["draft", "rejected"] },
      ...filter,
    })
      .select("title slug price discountPrice images shortDescription ratingsAverage ratingsCount")
      .sort(sort)
      .limit(limit)
      .maxTimeMS(3000)
      .lean();
  } catch {
    return [];
  }
};

const buildProductJsonLd = ({ product, reviews = [], baseUrl, canonicalUrl, metaDesc, imageUrl }) => {
  const allImages = Array.isArray(product.images) ? product.images.map((img) => img?.url).filter(Boolean) : [];
  const price = Number(product.discountPrice > 0 ? product.discountPrice : product.price) || 0;
  const inStock = (product.stock || 0) > 0;
  const validFrom = product.createdAt
    ? new Date(product.createdAt).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const freeShippingThreshold = Number(process.env.FREE_SHIPPING_THRESHOLD) || 999;
  const flatShippingRate = Number(process.env.FLAT_SHIPPING_RATE) || 99;
  const shippingRateValue = price >= freeShippingThreshold ? "0" : String(flatShippingRate);

  const reviewSchema = reviews.map((review) => ({
    "@type": "Review",
    author: {
      "@type": "Person",
      name: review.user?.name || "LyZov customer",
    },
    datePublished: review.createdAt ? new Date(review.createdAt).toISOString().split("T")[0] : undefined,
    reviewBody: review.comment,
    reviewRating: {
      "@type": "Rating",
      ratingValue: String(review.rating),
      bestRating: "5",
      worstRating: "1",
    },
  }));

  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: baseUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Shop",
      item: `${baseUrl}/shop`,
    },
  ];

  if (product.category?.name && product.category?.slug) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: product.category.name,
      item: `${baseUrl}/category/${encodeURIComponent(product.category.slug)}`,
    });
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 4,
      name: product.title,
      item: canonicalUrl,
    });
  } else {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: product.title,
      item: canonicalUrl,
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${canonicalUrl}#product`,
        name: product.title,
        description: metaDesc,
        image: allImages.length > 0 ? allImages : [imageUrl],
        sku: product.lyId || product.sku || undefined,
        ...(product.mpn ? { mpn: product.mpn } : {}),
        ...(product.brand?.name ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
        ...(product.category?.name ? { category: product.category.name } : {}),
        offers: {
          "@type": "Offer",
          url: canonicalUrl,
          priceCurrency: "INR",
          price: String(price),
          validFrom,
          priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: {
              "@type": "MonetaryAmount",
              value: shippingRateValue,
              currency: "INR",
            },
            shippingDestination: {
              "@type": "DefinedRegion",
              addressCountry: "IN",
            },
            deliveryTime: {
              "@type": "ShippingDeliveryTime",
              handlingTime: {
                "@type": "QuantitativeValue",
                minValue: 0,
                maxValue: 1,
                unitCode: "DAY",
              },
              transitTime: {
                "@type": "QuantitativeValue",
                minValue: 3,
                maxValue: 7,
                unitCode: "DAY",
              },
            },
          },
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "IN",
            returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
            merchantReturnDays: 7,
            returnMethod: "https://schema.org/ReturnByMail",
            returnFees: "https://schema.org/FreeReturn",
          },
          seller: {
            "@type": "Organization",
            name: "LyZov",
          },
        },
        ...(product.ratingsCount > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: String(product.ratingsAverage || 5),
                reviewCount: String(product.ratingsCount),
                bestRating: "5",
                worstRating: "1",
              },
            }
          : {}),
        ...(reviewSchema.length > 0 ? { review: reviewSchema } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems,
      },
    ],
  };
};

/**
 * Prerenders HTML for product pages by injecting rich SEO meta tags, JSON-LD schema,
 * and semantic crawlable HTML directly into the initial HTML response.
 */
const prerenderProductPage = async (slug, indexHtmlPath) => {
  const template = getIndexHtml(indexHtmlPath);
  if (!template) return null;

  const baseUrl = getBaseUrl();
  const cleanSlug = String(slug || "").toLowerCase().trim();

  if (!isDbConnected()) {
    return null;
  }

  let product = await Product.findOne({
    slug: cleanSlug,
    isActive: { $ne: false },
    moderationStatus: { $nin: ["draft", "rejected"] },
  })
    .populate("brand", "name")
    .populate("category", "name slug")
    .maxTimeMS(3000)
    .lean();

  if (!product) {
    const historicalProduct = await Product.findOne({
      slugHistory: cleanSlug,
      isActive: { $ne: false },
      moderationStatus: { $nin: ["draft", "rejected"] },
    })
      .select("slug")
      .maxTimeMS(3000)
      .lean();

    if (historicalProduct?.slug) {
      return {
        redirect: `/product/${historicalProduct.slug}`,
        statusCode: 301,
      };
    }

    const categories = await fetchTopCategories();
    const notFoundBody = renderPrerenderShell({
      heading: "Product Not Found",
      lead: "The requested product is currently unavailable or may have been moved.",
      breadcrumbs: [
        { name: "Home", href: "/" },
        { name: "Shop", href: "/shop" },
        { name: "Not Found" },
      ],
      categories,
    });

    return {
      statusCode: 404,
      notFound: true,
      html: applySeoToHtml(template, {
        title: "Product Not Found | LyZov",
        description: "The requested product is currently unavailable. Explore curated products on LyZov.",
        canonicalUrl: `${baseUrl}/shop`,
        robots: "noindex, nofollow",
        bodyHtml: notFoundBody,
      }),
    };
  }

  const [reviews, relatedProducts, categories] = await Promise.all([
    Review.find({ product: product._id, isApproved: true })
      .populate("user", "name")
      .sort("-createdAt")
      .limit(10)
      .maxTimeMS(3000)
      .lean(),
    fetchCatalogProducts(
      {
        _id: { $ne: product._id },
        ...(product.category?._id
          ? { $or: [{ categoryPath: product.category._id }, { category: product.category._id }] }
          : {}),
      },
      "-numSold -createdAt",
      8
    ),
    fetchTopCategories(),
  ]);

  const pageTitle = product.seo?.metaTitle || `${product.title} | Buy Online at LyZov`;
  const plainDesc = (product.shortDescription || product.description || "")
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
  const metaDesc =
    product.seo?.metaDescription ||
    (plainDesc ? `${plainDesc.slice(0, 155)} — Pan-India Delivery on LyZov.` : "Shop curated quality-checked products at LyZov.");

  const canonicalUrl = product.seo?.canonicalUrl || `${baseUrl}/product/${product.slug}`;
  const metaKeywords = product.searchKeyword || (Array.isArray(product.tags) ? product.tags.join(", ") : "");
  const imageUrl = optimizeCloudinaryUrl(product.images?.[0]?.url, 800) || `${baseUrl}/lyzov-logo.webp`;

  const jsonLd = buildProductJsonLd({
    product,
    reviews,
    baseUrl,
    canonicalUrl,
    metaDesc,
    imageUrl,
  });

  const price = Number(product.discountPrice > 0 ? product.discountPrice : product.price) || 0;
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    ...(product.category?.name && product.category?.slug
      ? [{ name: product.category.name, href: `/category/${product.category.slug}` }]
      : []),
    { name: product.title },
  ];

  const detailHtml = `<article class="boot-product-detail">
    <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.images?.[0]?.altText || product.title)}" width="320" height="320" />
    <div>
      <p><strong>Price:</strong> ${escapeHtml(formatInr(price))}${
        product.discountPrice > 0 && product.price > product.discountPrice
          ? ` <s>${escapeHtml(formatInr(product.price))}</s>`
          : ""
      }</p>
      <p><strong>Availability:</strong> ${(product.stock || 0) > 0 ? "In Stock — Pan-India Delivery" : "Out of Stock"}</p>
      ${product.brand?.name ? `<p><strong>Brand:</strong> ${escapeHtml(product.brand.name)}</p>` : ""}
      ${
        product.category?.name && product.category?.slug
          ? `<p><strong>Category:</strong> <a href="/category/${encodeURIComponent(product.category.slug)}">${escapeHtml(product.category.name)}</a></p>`
          : ""
      }
      <p>${escapeHtml(plainDesc || metaDesc)}</p>
    </div>
  </article>`;

  const bodyHtml = renderPrerenderShell({
    heading: product.title,
    lead: product.shortDescription ? product.shortDescription.replace(/<[^>]*>?/gm, " ").trim() : "",
    breadcrumbs,
    categories,
    products: relatedProducts,
    detailHtml,
  });

  return {
    statusCode: 200,
    html: applySeoToHtml(template, {
      title: pageTitle,
      description: metaDesc,
      canonicalUrl,
      robots: "index, follow",
      ogType: "product",
      ogImage: imageUrl,
      ogImageAlt: product.title,
      keywords: metaKeywords,
      jsonLd,
      bodyHtml,
    }),
  };
};

/**
 * Prerenders public storefront routes (`/`, `/shop`, `/products`, `/category/:slug`,
 * `/policies/:slug`, `/contact`, `/track`) so search engines receive real metadata,
 * JSON-LD schemas, and crawlable `<a href>` links in the initial HTML payload.
 */
const prerenderRoute = async (req, indexHtmlPath) => {
  const template = getIndexHtml(indexHtmlPath);
  if (!template) return null;

  const baseUrl = getBaseUrl();
  const pathname = (req.path || "/").replace(/\/+$/, "") || "/";
  const query = req.query || {};

  // Product detail pages
  if (pathname.startsWith("/product/")) {
    const slug = decodeURIComponent(pathname.replace(/^\/product\//, "").split("/")[0] || "");
    const productRes = await prerenderProductPage(slug, indexHtmlPath);
    if (productRes) return productRes;
  }

  // Category listing pages: /category/:slug OR /shop?category=:slug
  const isCategoryPath = pathname.startsWith("/category/");
  const requestedCategorySlug = isCategoryPath
    ? decodeURIComponent(pathname.replace(/^\/category\//, "").split("/")[0] || "")
    : query.category
    ? String(query.category).trim()
    : "";

  const hasSearchOrFilterParams = Boolean(
    query.search || query.minPrice || query.maxPrice || query.minRating || query.sort || query.brand
  );

  if (isCategoryPath || pathname === "/shop" || pathname === "/products") {
    const categories = await fetchTopCategories();
    let activeCategory = null;

    if (requestedCategorySlug && isDbConnected()) {
      const normalized = requestedCategorySlug.toLowerCase();
      activeCategory = await Category.findOne({ slug: normalized, isActive: { $ne: false } })
        .select("name slug description level parent ancestors")
        .maxTimeMS(3000)
        .lean();

      if (isCategoryPath && !activeCategory) {
        const notFoundBody = renderPrerenderShell({
          heading: "Category Not Found",
          lead: "This category does not exist or is no longer active. Browse all products below.",
          breadcrumbs: [
            { name: "Home", href: "/" },
            { name: "Shop", href: "/shop" },
            { name: "Not Found" },
          ],
          categories,
        });
        return {
          statusCode: 404,
          notFound: true,
          html: applySeoToHtml(template, {
            title: "Category Not Found | LyZov",
            description: "Explore curated product categories on LyZov.",
            canonicalUrl: `${baseUrl}/shop`,
            robots: "noindex, nofollow",
            bodyHtml: notFoundBody,
          }),
        };
      }
    }

    const productFilter = activeCategory
      ? { $or: [{ categoryPath: activeCategory._id }, { category: activeCategory._id }] }
      : {};
    const products = await fetchCatalogProducts(productFilter, "-isFeatured -numSold -createdAt", 24);

    if (activeCategory) {
      const canonicalUrl = `${baseUrl}/category/${encodeURIComponent(activeCategory.slug)}`;
      const title = `${activeCategory.name} — Buy Online in India | LyZov`;
      const description =
        activeCategory.description ||
        `Shop quality-checked ${activeCategory.name} products online at LyZov. Enjoy transparent pricing, secure UPI checkout, and safe Pan-India delivery.`;
      const breadcrumbs = [
        { name: "Home", href: "/" },
        { name: "Shop", href: "/shop" },
        ...(Array.isArray(activeCategory.ancestors)
          ? activeCategory.ancestors.map((anc) => ({
              name: anc.name,
              href: `/category/${encodeURIComponent(anc.slug)}`,
            }))
          : []),
        { name: activeCategory.name },
      ];

      const subcatLinks = categories.filter(
        (c) => c.parent && String(c.parent) === String(activeCategory._id) && c.slug
      );
      const extraNavHtml =
        subcatLinks.length > 0
          ? `<nav aria-label="Subcategories" class="boot-section">
              <h2>Subcategories in ${escapeHtml(activeCategory.name)}</h2>
              <div class="boot-links">${subcatLinks
                .map((sub) => `<a href="/category/${encodeURIComponent(sub.slug)}">${escapeHtml(sub.name)}</a>`)
                .join("")}</div>
            </nav>`
          : "";

      const bodyHtml = renderPrerenderShell({
        heading: activeCategory.name,
        lead: description,
        breadcrumbs,
        categories,
        products,
        extraNavHtml,
      });

      const jsonLd = buildItemListSchema({
        baseUrl,
        canonicalUrl,
        name: title,
        description,
        products,
      });

      return {
        statusCode: 200,
        html: applySeoToHtml(template, {
          title,
          description,
          canonicalUrl,
          robots: hasSearchOrFilterParams ? "noindex, follow" : "index, follow",
          jsonLd,
          bodyHtml,
        }),
      };
    }

    const shopCanonical = `${baseUrl}/shop`;
    const shopTitle = query.search
      ? `Results for "${String(query.search).trim()}" — Shop | LyZov`
      : "Shop All Products — Quality-Checked Goods | LyZov";
    const shopDescription =
      "Browse all quality-checked products on LyZov. Explore God Idols, Fitness Accessories, Electronics, Car Accessories, Home Decor & Lifestyle items across India.";

    const bodyHtml = renderPrerenderShell({
      heading: query.search ? `Search Results for "${String(query.search).trim()}"` : "All Products Catalog",
      lead: shopDescription,
      breadcrumbs: [{ name: "Home", href: "/" }, { name: "Shop" }],
      categories,
      products,
    });

    const jsonLd = buildItemListSchema({
      baseUrl,
      canonicalUrl: shopCanonical,
      name: shopTitle,
      description: shopDescription,
      products,
    });

    return {
      statusCode: 200,
      html: applySeoToHtml(template, {
        title: shopTitle,
        description: shopDescription,
        canonicalUrl: shopCanonical,
        robots: hasSearchOrFilterParams ? "noindex, follow" : "index, follow",
        jsonLd,
        bodyHtml,
      }),
    };
  }

  // Official Policy Pages
  if (pathname === "/policies") {
    return { redirect: "/policies/privacy-policy", statusCode: 301 };
  }
  if (pathname.startsWith("/policies/")) {
    const policySlug = pathname.replace(/^\/policies\//, "").split("/")[0];
    const policyInfo = POLICY_META[policySlug] || POLICY_META["privacy-policy"];
    const canonicalSlug = POLICY_META[policySlug] ? policySlug : "privacy-policy";
    const canonicalUrl = `${baseUrl}/policies/${canonicalSlug}`;
    const categories = await fetchTopCategories();
    const extraNavHtml = `<nav aria-label="All Platform Policies" class="boot-section">
      <h2>Official LyZov Policies</h2>
      <div class="boot-links">${POLICY_LINKS.map(
        (p) => `<a href="${escapeHtml(p.path)}">${escapeHtml(p.label)}</a>`
      ).join("")}</div>
    </nav>`;

    return {
      statusCode: 200,
      html: applySeoToHtml(template, {
        title: policyInfo.title,
        description: policyInfo.description,
        canonicalUrl,
        robots: "index, follow",
        bodyHtml: renderPrerenderShell({
          heading: policyInfo.heading,
          lead: policyInfo.description,
          breadcrumbs: [
            { name: "Home", href: "/" },
            { name: "Policies", href: "/policies/privacy-policy" },
            { name: policyInfo.heading },
          ],
          categories,
          extraNavHtml,
        }),
      }),
    };
  }

  // Contact Support
  if (pathname === "/contact") {
    const categories = await fetchTopCategories();
    const title = "Contact Us — LyZov Customer Support";
    const description =
      "Contact LyZov Customer Support for order tracking, product sizing, 7-day replacement assistance, or general inquiries across India.";
    return {
      statusCode: 200,
      html: applySeoToHtml(template, {
        title,
        description,
        canonicalUrl: `${baseUrl}/contact`,
        robots: "index, follow",
        bodyHtml: renderPrerenderShell({
          heading: "LyZov Customer Support & Concierge Desk",
          lead: "Contact LyZov customer support Monday–Saturday for order tracking, delivery updates, and product inquiries.",
          breadcrumbs: [{ name: "Home", href: "/" }, { name: "Contact Support" }],
          categories,
        }),
      }),
    };
  }

  // Public Track Order
  if (pathname === "/track") {
    const categories = await fetchTopCategories();
    const title = "Track Your Order — Live Shipment Status | LyZov";
    const description =
      "Track your LyZov order status and live courier delivery updates across India using your order ID.";
    return {
      statusCode: 200,
      html: applySeoToHtml(template, {
        title,
        description,
        canonicalUrl: `${baseUrl}/track`,
        robots: "index, follow",
        bodyHtml: renderPrerenderShell({
          heading: "Track Your LyZov Order",
          lead: description,
          breadcrumbs: [{ name: "Home", href: "/" }, { name: "Track Order" }],
          categories,
        }),
      }),
    };
  }

  // Homepage (`/`)
  if (pathname === "/") {
    const [categories, products] = await Promise.all([
      fetchTopCategories(),
      fetchCatalogProducts({}, "-isFeatured -numSold -createdAt", 16),
    ]);
    const title = "LyZov — India's Trusted Online Shopping Platform";
    const description =
      "Shop curated God idols, fitness gear, electronics & home essentials on LyZov. Enjoy direct pricing, verified quality & fast Pan-India delivery.";
    const bodyHtml = renderPrerenderShell({
      heading: "LyZov — India's Trusted Online Shopping Platform",
      lead: description,
      categories,
      products,
    });
    return {
      statusCode: 200,
      html: applySeoToHtml(template, {
        title,
        description,
        canonicalUrl: baseUrl,
        robots: "index, follow",
        jsonLd: buildItemListSchema({
          baseUrl,
          canonicalUrl: baseUrl,
          name: title,
          description,
          products,
        }),
        bodyHtml,
      }),
    };
  }

  // Known dynamic client-only SPA routes (served with index.html for client-side routing)
  const isKnownSpaRoute =
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email") ||
    pathname === "/complete-profile" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/order") ||
    pathname.startsWith("/seller") ||
    pathname.startsWith("/admin");

  if (isKnownSpaRoute) {
    return null;
  }

  // Any other unmatched route is a true 404
  const categories = await fetchTopCategories();
  const notFoundHtml = renderPrerenderShell({
    heading: "404 — Page Not Found",
    lead: "The page you're looking for doesn't exist or may have moved. Explore our catalog or head back to continue shopping.",
    breadcrumbs: [{ name: "Home", href: "/" }, { name: "404 Not Found" }],
    categories,
    extraNavHtml: `<div style="text-align: center; margin: 2rem 0;">
      <a href="/shop" style="display: inline-block; padding: 0.75rem 1.5rem; background: #d97706; color: #fff; border-radius: 9999px; text-decoration: none; font-weight: 700;">Browse All Products</a>
      <a href="/" style="display: inline-block; margin-left: 1rem; padding: 0.75rem 1.5rem; border: 1px solid #d97706; color: #d97706; border-radius: 9999px; text-decoration: none; font-weight: 700;">Back to Home</a>
    </div>`,
  });

  return {
    statusCode: 404,
    notFound: true,
    html: applySeoToHtml(template, {
      title: "Page Not Found (404) | LyZov",
      description: "The page you are looking for does not exist on LyZov. Browse our curated catalog of God idols, fitness gear, and home essentials.",
      canonicalUrl: `${baseUrl}/404`,
      robots: "noindex, nofollow",
      bodyHtml: notFoundHtml,
    }),
  };
};

module.exports = {
  prerenderProductPage,
  prerenderRoute,
  applySeoToHtml,
  renderPrerenderShell,
  buildProductJsonLd,
  buildItemListSchema,
  escapeHtml,
  SOCIAL_LINKS,
  DEFAULT_CATEGORIES,
  POLICY_META,
};
