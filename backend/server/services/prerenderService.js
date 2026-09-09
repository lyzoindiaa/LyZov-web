const fs = require("fs");
const path = require("path");
const Product = require("../models/Product");
const Review = require("../models/Review");

let cachedHtml = null;
let lastMtime = 0;

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

const escapeHtml = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Prerenders HTML for product pages by injecting rich SEO meta tags and JSON-LD schema
 * directly into the initial HTML response.
 */
const prerenderProductPage = async (slug, indexHtmlPath) => {
  const template = getIndexHtml(indexHtmlPath);
  if (!template) return null;

  const rawBaseUrl = process.env.CLIENT_URL || "https://lyzov.com";
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");

  const cleanSlug = String(slug || "").toLowerCase().trim();

  // Find active product by slug
  let product = await Product.findOne({ slug: cleanSlug, isActive: true })
    .populate("brand", "name")
    .populate("category", "name slug")
    .lean();

  // Check 301 slugHistory if direct slug not found
  if (!product) {
    const historicalProduct = await Product.findOne({ slugHistory: cleanSlug, isActive: true }).lean();
    if (historicalProduct) {
      return {
        redirect: `/product/${historicalProduct.slug}`,
        statusCode: 301,
      };
    }
    return null;
  }

  const reviews = await Review.find({ product: product._id, isApproved: true })
    .populate("user", "name")
    .sort("-createdAt")
    .limit(10)
    .lean();

  const pageTitle = product.seo?.metaTitle || `${product.title} | Buy Online at LyZov`;
  const plainDesc = (product.shortDescription || product.description || "")
    .replace(/<[^>]*>?/gm, "")
    .trim();
  const metaDesc =
    product.seo?.metaDescription ||
    (plainDesc ? `${plainDesc.slice(0, 150)} — Pan-India Delivery on LyZov.` : "Shop authentic lifestyle and fitness products at LyZov.");

  const canonicalUrl = product.seo?.canonicalUrl || `${baseUrl}/product/${product.slug}`;
  const imageUrl = product.images?.[0]?.url || `${baseUrl}/lyzov-logo.png`;
  const allImages = Array.isArray(product.images) ? product.images.map((img) => img.url).filter(Boolean) : [];

  const price = product.discountPrice > 0 ? product.discountPrice : product.price;
  const inStock = (product.stock || 0) > 0;
  const validFrom = product.createdAt ? new Date(product.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
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

  // Build Google Schema.org JSON-LD
  const schemaGraph = [
    {
      "@type": "Product",
      "@id": `${canonicalUrl}#product`,
      name: product.title,
      description: metaDesc,
      image: allImages.length > 0 ? allImages : [imageUrl],
      sku: product.lyId || product.sku || undefined,
      // Only include MPN if explicitly provided by seller
      ...(product.mpn ? { mpn: product.mpn } : {}),
      ...(product.brand?.name ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
      offers: {
        "@type": "Offer",
        url: canonicalUrl,
        priceCurrency: "INR",
        price: price ? String(price) : "0",
        validFrom,
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: {
            "@type": "MonetaryAmount",
            value: "9.99",
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
          name: "LyZov Store",
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
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: baseUrl,
        },
        ...(product.category?.name
          ? [
              {
                "@type": "ListItem",
                position: 2,
                name: product.category.name,
                item: `${baseUrl}/shop?category=${product.category.slug || ""}`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: product.title,
                item: canonicalUrl,
              },
            ]
          : [
              {
                "@type": "ListItem",
                position: 2,
                name: product.title,
                item: canonicalUrl,
              },
            ]),
      ],
    },
  ];

  const jsonLdScript = `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@graph": schemaGraph }, null, 2)}\n</script>`;

  // Replace default title and meta tags
  let html = template;

  // Replace <title>...</title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);

  // Replace or inject description
  if (/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeHtml(metaDesc)}" />`);
  }

  // Inject canonical and dynamic OpenGraph/Twitter meta before </head>
  const metaTagsToInject = `
    <!-- LyZov Dynamic SEO & OpenGraph -->
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:type" content="product" />
    <meta property="og:title" content="${escapeHtml(pageTitle)}" />
    <meta property="og:description" content="${escapeHtml(metaDesc)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(metaDesc)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    ${jsonLdScript}
  `;

  html = html.replace("</head>", `${metaTagsToInject}\n</head>`);

  return { html };
};

module.exports = {
  prerenderProductPage,
};
