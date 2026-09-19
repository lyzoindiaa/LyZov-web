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

// @desc    Generate dynamic XML sitemap (products, categories, core pages)
// @route   GET /sitemap.xml
// @access  Public
const getSitemap = async (req, res) => {
  try {
    const rawBaseUrl = process.env.CLIENT_URL || "https://lyzov.com";
    const baseUrl = rawBaseUrl.replace(/\/+$/, "");

    // Fetch active products with minimal fields
    const products = await Product.find({ isActive: true })
      .select("slug updatedAt title images")
      .lean();

    // Fetch active categories
    const categories = await Category.find({})
      .select("slug updatedAt")
      .lean();

    const staticPages = [
      { path: "", updatedAt: new Date() },
      { path: "/shop", updatedAt: new Date() },
      { path: "/products", updatedAt: new Date() },
      { path: "/contact", updatedAt: new Date() },
      { path: "/policies/privacy-policy", updatedAt: new Date() },
      { path: "/policies/terms-and-conditions", updatedAt: new Date() },
      { path: "/policies/return-exchange-policy", updatedAt: new Date() },
      { path: "/policies/refund-cancellation-policy", updatedAt: new Date() },
      { path: "/policies/shipping-delivery-policy", updatedAt: new Date() },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(`${baseUrl}${page.path}`)}</loc>\n`;
      xml += `    <lastmod>${(page.updatedAt || new Date()).toISOString()}</lastmod>\n`;
      xml += `  </url>\n`;
    }

    // Category pages
    for (const cat of categories) {
      if (cat.slug) {
        xml += `  <url>\n`;
        xml += `    <loc>${escapeXml(`${baseUrl}/shop?category=${cat.slug}`)}</loc>\n`;
        if (cat.updatedAt) {
          xml += `    <lastmod>${new Date(cat.updatedAt).toISOString()}</lastmod>\n`;
        }
        xml += `  </url>\n`;
      }
    }

    // Product pages with image sitemaps
    for (const prod of products) {
      if (prod.slug) {
        xml += `  <url>\n`;
        xml += `    <loc>${escapeXml(`${baseUrl}/product/${prod.slug}`)}</loc>\n`;
        if (prod.updatedAt) {
          xml += `    <lastmod>${new Date(prod.updatedAt).toISOString()}</lastmod>\n`;
        }
        if (Array.isArray(prod.images)) {
          for (const img of prod.images) {
            if (img.url) {
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

    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=3600, s-maxage=3600");
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
  const rawBaseUrl = process.env.CLIENT_URL || "https://lyzov.com";
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");

  const content = `User-agent: *
Allow: /
Allow: /shop
Allow: /products
Allow: /products/
Allow: /product/
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
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;

  res.header("Content-Type", "text/plain");
  res.header("Cache-Control", "public, max-age=86400");
  return res.status(200).send(content);
};

module.exports = {
  getSitemap,
  getRobotsTxt,
};
