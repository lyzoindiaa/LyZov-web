const Product = require("../models/Product");
const Category = require("../models/Category");

const escapeXml = (unsafe) => {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const getBaseUrl = () => {
  const rawBaseUrl = process.env.CLIENT_URL || "https://lyzov.com";
  return rawBaseUrl.replace(/\/+$/, "");
};

const buildSitemapXml = ({ baseUrl = getBaseUrl(), products = [], categories = [], now = new Date() } = {}) => {
  const isoNow = new Date(now).toISOString();
  const staticPages = [
    { path: "", changefreq: "daily", priority: "1.0", updatedAt: isoNow },
    { path: "/shop", changefreq: "daily", priority: "0.9", updatedAt: isoNow },
    { path: "/track", changefreq: "monthly", priority: "0.5", updatedAt: isoNow },
    { path: "/contact", changefreq: "monthly", priority: "0.6", updatedAt: isoNow },
    { path: "/policies/privacy-policy", changefreq: "monthly", priority: "0.4", updatedAt: isoNow },
    { path: "/policies/terms-and-conditions", changefreq: "monthly", priority: "0.4", updatedAt: isoNow },
    { path: "/policies/return-exchange-policy", changefreq: "monthly", priority: "0.4", updatedAt: isoNow },
    { path: "/policies/refund-cancellation-policy", changefreq: "monthly", priority: "0.4", updatedAt: isoNow },
    { path: "/policies/shipping-delivery-policy", changefreq: "monthly", priority: "0.4", updatedAt: isoNow },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  for (const page of staticPages) {
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(`${baseUrl}${page.path}`)}</loc>\n`;
    xml += `    <lastmod>${page.updatedAt}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  for (const cat of categories) {
    if (cat?.slug) {
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(`${baseUrl}/category/${encodeURIComponent(cat.slug)}`)}</loc>\n`;
      if (cat.updatedAt) {
        xml += `    <lastmod>${new Date(cat.updatedAt).toISOString()}</lastmod>\n`;
      }
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }
  }

  for (const prod of products) {
    if (prod?.slug) {
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(`${baseUrl}/product/${encodeURIComponent(prod.slug)}`)}</loc>\n`;
      if (prod.updatedAt) {
        xml += `    <lastmod>${new Date(prod.updatedAt).toISOString()}</lastmod>\n`;
      }
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      if (Array.isArray(prod.images)) {
        for (const img of prod.images) {
          if (img?.url) {
            xml += `    <image:image>\n`;
            xml += `      <image:loc>${escapeXml(img.url)}</image:loc>\n`;
            xml += `      <image:title>${escapeXml(img.altText || prod.title || "LyZov Product")}</image:title>\n`;
            xml += `    </image:image>\n`;
          }
        }
      }
      xml += `  </url>\n`;
    }
  }

  xml += `</urlset>`;
  return xml;
};

const buildRobotsTxt = (baseUrl = getBaseUrl()) => `User-agent: *
Allow: /
Allow: /shop
Allow: /products
Allow: /product/
Allow: /category/
Allow: /policies/
Allow: /contact
Allow: /track

Disallow: /dashboard/
Disallow: /admin/
Disallow: /seller/
Disallow: /checkout
Disallow: /cart
Disallow: /login
Disallow: /register
Disallow: /reset-password/
Disallow: /verify-email/
Disallow: /forgot-password
Disallow: /complete-profile
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;

// @desc    Generate dynamic XML sitemap (products, categories, core pages)
// @route   GET /sitemap.xml
// @access  Public
const getSitemap = async (req, res) => {
  try {
    const baseUrl = getBaseUrl();

    const products = await Product.find({
      isActive: { $ne: false },
      moderationStatus: { $nin: ["draft", "rejected"] },
    })
      .select("slug updatedAt title images")
      .sort("-updatedAt")
      .lean();

    const categories = await Category.find({ isActive: { $ne: false } })
      .select("slug updatedAt")
      .sort("displayOrder name")
      .lean();

    const xml = buildSitemapXml({ baseUrl, products, categories });

    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(xml);
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return res.status(500).send("Error generating sitemap");
  }
};

// @desc    Dynamic robots.txt
// @route   GET /robots.txt
// @access  Public
const getRobotsTxt = (req, res) => {
  const content = buildRobotsTxt(getBaseUrl());

  res.header("Content-Type", "text/plain");
  res.header("Cache-Control", "public, max-age=86400");
  return res.status(200).send(content);
};

module.exports = {
  getSitemap,
  getRobotsTxt,
  buildSitemapXml,
  buildRobotsTxt,
  escapeXml,
};
