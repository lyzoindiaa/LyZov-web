const assert = require("node:assert");
const path = require("node:path");
const fs = require("node:fs");
const { test, describe } = require("node:test");
const mongoose = require("mongoose");

const Product = require("../models/Product");
const Category = require("../models/Category");
const Review = require("../models/Review");

const {
  buildSitemapXml,
  buildRobotsTxt,
  escapeXml,
} = require("../controllers/sitemapController");

const {
  applySeoToHtml,
  renderPrerenderShell,
  buildProductJsonLd,
  prerenderRoute,
  prerenderProductPage,
} = require("../services/prerenderService");

const TEMPLATE_PATH = path.resolve(__dirname, "../../../frontend/client/index.html");

const countMatches = (str, regex) => (str.match(regex) || []).length;

describe("SEO Sitemap, Robots & Prerender Suite", () => {
  test("SEO-01: buildSitemapXml outputs clean /category/:slug and /product/:slug URLs with XML escaping", () => {
    const xml = buildSitemapXml({
      baseUrl: "https://lyzov.com",
      categories: [
        { slug: "god-idol", updatedAt: "2026-10-01T00:00:00.000Z" },
      ],
      products: [
        {
          slug: "brass-ganesha-idol",
          title: "Brass Ganesha & Decor <Edition>",
          updatedAt: "2026-10-05T00:00:00.000Z",
          images: [{ url: "https://cdn.example.com/ganesha.jpg?w=800&fit=cover", altText: "" }],
        },
        {
          slug: "ganesha-custom-alt",
          title: "Ganesha Fallback",
          updatedAt: "2026-10-05T00:00:00.000Z",
          images: [{ url: "https://cdn.example.com/alt.jpg", altText: "Ganesha & Brass" }],
        },
      ],
    });

    assert.ok(xml.includes("<loc>https://lyzov.com/shop</loc>"));
    assert.ok(xml.includes("<loc>https://lyzov.com/track</loc>"));
    assert.ok(xml.includes("<loc>https://lyzov.com/category/god-idol</loc>"));
    assert.ok(!xml.includes("/shop?category="), "Sitemap must use clean /category/:slug instead of query strings");
    assert.ok(xml.includes("<loc>https://lyzov.com/product/brass-ganesha-idol</loc>"));
    assert.ok(xml.includes("Ganesha &amp; Brass"));
    assert.ok(xml.includes("&lt;Edition&gt;"));
    assert.strictEqual(escapeXml(`"<'&>`), "&quot;&lt;&apos;&amp;&gt;");
  });

  test("SEO-02: buildRobotsTxt allows /product/, /category/, /shop and matches public/robots.txt", () => {
    const dynamicRobots = buildRobotsTxt("https://lyzov.com").replace(/\r\n/g, "\n").trim();
    const publicRobots = fs
      .readFileSync(path.resolve(__dirname, "../../../frontend/client/public/robots.txt"), "utf8")
      .replace(/\r\n/g, "\n")
      .trim();

    assert.strictEqual(dynamicRobots, publicRobots, "Dynamic and static robots.txt must stay in sync");
    assert.ok(dynamicRobots.includes("Allow: /product/"));
    assert.ok(dynamicRobots.includes("Allow: /category/"));
    assert.ok(dynamicRobots.includes("Disallow: /complete-profile"));
    assert.ok(!dynamicRobots.includes("Allow: /products/"));
    assert.ok(dynamicRobots.includes("Sitemap: https://lyzov.com/sitemap.xml"));
  });

  test("SEO-03: applySeoToHtml prevents duplicate canonical/OG/Twitter tags and escapes JSON-LD XSS", () => {
    const rawTemplate = fs.readFileSync(TEMPLATE_PATH, "utf8");
    const rendered = applySeoToHtml(rawTemplate, {
      title: "Fitness Dumbbells | LyZov",
      description: "Shop adjustable dumbbells in India",
      canonicalUrl: "https://lyzov.com/product/adjustable-dumbbells",
      robots: "index, follow",
      ogType: "product",
      ogImage: "https://cdn.example.com/dumbbell.jpg",
      keywords: "dumbbells, fitness",
      jsonLd: { "@context": "https://schema.org", name: "</script><script>alert(1)</script>" },
      bodyHtml: renderPrerenderShell({
        heading: "Adjustable Dumbbells Set",
        lead: "Built for home gyms across India.",
        products: [{ slug: "adjustable-dumbbells", title: "Adjustable Dumbbells Set", price: 1499, images: [] }],
      }),
    });

    assert.strictEqual(countMatches(rendered, /<link\s+rel=["']canonical["']/gi), 1, "Must emit strictly 1 canonical tag");
    assert.strictEqual(countMatches(rendered, /<meta\s+name=["']robots["']/gi), 1, "Must emit strictly 1 robots meta tag");
    assert.strictEqual(countMatches(rendered, /property=["']og:title["']/gi), 1, "Must emit strictly 1 og:title tag");
    assert.strictEqual(countMatches(rendered, /property=["']og:image["']/gi), 1, "Must emit strictly 1 og:image tag");
    assert.strictEqual(countMatches(rendered, /name=["']twitter:card["']/gi), 1, "Must emit strictly 1 twitter:card tag");
    assert.ok(rendered.includes('href="https://lyzov.com/product/adjustable-dumbbells"'));
    assert.ok(!rendered.includes("GSC_VERIFICATION_TOKEN"), "Must not ship placeholder GSC token literal");
    assert.ok(!rendered.includes("</script><script>alert(1)"), "Must escape </script> inside JSON-LD");
    assert.ok(rendered.includes('href="/product/adjustable-dumbbells"'), "Body HTML must contain real product link");
    assert.ok(rendered.includes('href="https://www.instagram.com/lyzovindia/"'), "Footer must contain real social link");
    assert.ok(rendered.includes("<h1>Adjustable Dumbbells Set</h1>"));
  });

  test("SEO-04: buildProductJsonLd computes truthful INR shipping rates and Category breadcrumbs", () => {
    const lowPriceProduct = {
      title: "Brass Diya Holder",
      slug: "brass-diya-holder",
      price: 499,
      discountPrice: 0,
      stock: 10,
      ratingsAverage: 4.8,
      ratingsCount: 4,
      brand: { name: "LyZov" },
      category: { name: "God Idol", slug: "god-idol" },
      images: [{ url: "https://cdn.example.com/diya.jpg" }],
    };

    const lowGraph = buildProductJsonLd({
      product: lowPriceProduct,
      reviews: [],
      baseUrl: "https://lyzov.com",
      canonicalUrl: "https://lyzov.com/product/brass-diya-holder",
      metaDesc: "Brass Diya Holder on LyZov",
      imageUrl: "https://cdn.example.com/diya.jpg",
    });

    const lowOffer = lowGraph["@graph"][0].offers;
    assert.strictEqual(lowOffer.priceCurrency, "INR");
    assert.strictEqual(lowOffer.shippingDetails.shippingRate.value, String(Number(process.env.FLAT_SHIPPING_RATE) || 99));

    const breadcrumbs = lowGraph["@graph"][1].itemListElement;
    assert.strictEqual(breadcrumbs.length, 4);
    assert.strictEqual(breadcrumbs[2].name, "God Idol");
    assert.strictEqual(breadcrumbs[2].item, "https://lyzov.com/category/god-idol");

    const freeShipProduct = { ...lowPriceProduct, price: 1499 };
    const highGraph = buildProductJsonLd({
      product: freeShipProduct,
      reviews: [],
      baseUrl: "https://lyzov.com",
      canonicalUrl: "https://lyzov.com/product/brass-diya-holder",
      metaDesc: "Brass Diya Holder on LyZov",
      imageUrl: "https://cdn.example.com/diya.jpg",
    });
    assert.strictEqual(highGraph["@graph"][0].offers.shippingDetails.shippingRate.value, "0");
  });

  test("SEO-05: prerenderRoute handles category, shop filters noindex, policies, contact, track & 404 product", async () => {
    // 1. Offline / generic routes without DB
    const contactRes = await prerenderRoute({ path: "/contact", query: {} }, TEMPLATE_PATH);
    assert.strictEqual(contactRes.statusCode, 200);
    assert.ok(contactRes.html.includes('href="https://lyzov.com/contact"'));
    assert.ok(contactRes.html.includes("<h1>LyZov Customer Support &amp; Concierge Desk</h1>"));

    const trackRes = await prerenderRoute({ path: "/track", query: {} }, TEMPLATE_PATH);
    assert.strictEqual(trackRes.statusCode, 200);
    assert.ok(trackRes.html.includes('href="https://lyzov.com/track"'));

    const policyRes = await prerenderRoute({ path: "/policies/shipping-delivery-policy", query: {} }, TEMPLATE_PATH);
    assert.strictEqual(policyRes.statusCode, 200);
    assert.ok(policyRes.html.includes('href="https://lyzov.com/policies/shipping-delivery-policy"'));
    assert.ok(policyRes.html.includes('href="/policies/privacy-policy"'));

    const filteredShop = await prerenderRoute({ path: "/shop", query: { search: "dumbbell" } }, TEMPLATE_PATH);
    assert.strictEqual(filteredShop.statusCode, 200);
    assert.ok(filteredShop.html.includes('content="noindex, follow"'));
    assert.ok(filteredShop.html.includes('href="https://lyzov.com/shop"'));

    // 2. Stub DB connection & Mongoose queries to verify 404 + live Product + live Category prerendering
    const origDesc = Object.getOwnPropertyDescriptor(mongoose.connection, "readyState");
    const origProdFindOne = Product.findOne;
    const origProdFind = Product.find;
    const origCatFind = Category.find;
    const origCatFindOne = Category.findOne;
    const origRevFind = Review.find;

    try {
      Object.defineProperty(mongoose.connection, "readyState", { configurable: true, get: () => 1 });
      const makeChain = (val) => ({
        populate() { return this; },
        select() { return this; },
        sort() { return this; },
        limit() { return this; },
        maxTimeMS() { return this; },
        lean: async () => val,
      });

      Product.findOne = () => makeChain(null);
      Product.find = () => makeChain([]);
      Category.find = () => makeChain([{ _id: "cat1", name: "Fitness Gear", slug: "fitness-gear" }]);
      Category.findOne = () => makeChain({ _id: "cat1", name: "Fitness Gear", slug: "fitness-gear", ancestors: [] });
      Review.find = () => makeChain([]);

      const notFoundProd = await prerenderProductPage("non-existent-item", TEMPLATE_PATH);
      assert.strictEqual(notFoundProd.statusCode, 404);
      assert.strictEqual(notFoundProd.notFound, true);
      assert.ok(notFoundProd.html.includes('content="noindex, nofollow"'));

      const catRes = await prerenderRoute({ path: "/category/fitness-gear", query: {} }, TEMPLATE_PATH);
      assert.strictEqual(catRes.statusCode, 200);
      assert.ok(catRes.html.includes('href="https://lyzov.com/category/fitness-gear"'));
      assert.ok(catRes.html.includes("<h1>Fitness Gear</h1>"));
    } finally {
      if (origDesc) Object.defineProperty(mongoose.connection, "readyState", origDesc);
      Product.findOne = origProdFindOne;
      Product.find = origProdFind;
      Category.find = origCatFind;
      Category.findOne = origCatFindOne;
      Review.find = origRevFind;
    }
  });
});
