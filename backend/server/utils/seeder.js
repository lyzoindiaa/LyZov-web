const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Category = require("../models/Category");
const Brand = require("../models/Brand");
const Product = require("../models/Product");

const seed = async () => {
  await connectDB();

  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({
      $or: [
        { role: { $in: ["admin", "seller"] } },
        { email: { $in: ["admin@lyzov.com", "seller@lyzov.com"] } },
      ],
    }),
    Category.deleteMany(),
    Brand.deleteMany(),
    Product.deleteMany(),
  ]);

  console.log("Creating seller user...");
  await User.create({
    name: "LyZov Seller",
    email: "seller@lyzov.com",
    password: "Admin@1234",
    role: "seller",
    isEmailVerified: true,
  });

  console.log("Creating 3-tier categories (Category → Subcategory → Item)...");

  // 1. Level 1: Root Categories
  const menRoot = await Category.create({
    name: "Men",
    slug: "men",
    description: "Men's contemporary style, fashion, and wardrobe essentials",
    level: 1,
    parent: null,
    ancestors: [],
    displayOrder: 1,
    image: {
      url: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800",
      publicId: "lyzov/sample/category-men",
    },
  });

  const womenRoot = await Category.create({
    name: "Women",
    slug: "women",
    description: "Women's modern fashion, elevated apparel, and chic accessories",
    level: 1,
    parent: null,
    ancestors: [],
    displayOrder: 2,
    image: {
      url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800",
      publicId: "lyzov/sample/category-women",
    },
  });

  const accessoriesRoot = await Category.create({
    name: "Accessories",
    slug: "accessories",
    description: "Timepieces, fine leather goods, and refined lifestyle accessories",
    level: 1,
    parent: null,
    ancestors: [],
    displayOrder: 3,
    image: {
      url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800",
      publicId: "lyzov/sample/category-accessories",
    },
  });

  // 2. Level 2: Subcategories
  // Under Men:
  const menClothing = await Category.create({
    name: "Clothing",
    slug: "men-clothing",
    description: "Tailored shirts, casual tees, and premium trousers for gentlemen",
    level: 2,
    parent: menRoot._id,
    ancestors: [{ _id: menRoot._id, name: menRoot.name, slug: menRoot.slug, level: 1 }],
    displayOrder: 1,
    image: {
      url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
      publicId: "lyzov/sample/men-clothing",
    },
  });

  const menFootwear = await Category.create({
    name: "Footwear",
    slug: "men-footwear",
    description: "Handcrafted sneakers, loafers, and dress shoes",
    level: 2,
    parent: menRoot._id,
    ancestors: [{ _id: menRoot._id, name: menRoot.name, slug: menRoot.slug, level: 1 }],
    displayOrder: 2,
    image: {
      url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
      publicId: "lyzov/sample/men-footwear",
    },
  });

  // Under Women:
  const womenWestern = await Category.create({
    name: "Western Wear",
    slug: "women-western-wear",
    description: "Flowing dresses, bespoke blouses, and contemporary fits",
    level: 2,
    parent: womenRoot._id,
    ancestors: [{ _id: womenRoot._id, name: womenRoot.name, slug: womenRoot.slug, level: 1 }],
    displayOrder: 1,
    image: {
      url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800",
      publicId: "lyzov/sample/women-western",
    },
  });

  // Under Accessories:
  const watchesSub = await Category.create({
    name: "Timepieces & Watches",
    slug: "accessories-timepieces",
    description: "Luxury chronographs, automatic watches, and minimalist dials",
    level: 2,
    parent: accessoriesRoot._id,
    ancestors: [{ _id: accessoriesRoot._id, name: accessoriesRoot.name, slug: accessoriesRoot.slug, level: 1 }],
    displayOrder: 1,
    image: {
      url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800",
      publicId: "lyzov/sample/accessories-watches",
    },
  });

  const leatherGoodsSub = await Category.create({
    name: "Leather Goods",
    slug: "accessories-leather-goods",
    description: "Full-grain leather wallets, belts, and briefcases",
    level: 2,
    parent: accessoriesRoot._id,
    ancestors: [{ _id: accessoriesRoot._id, name: accessoriesRoot.name, slug: accessoriesRoot.slug, level: 1 }],
    displayOrder: 2,
    image: {
      url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800",
      publicId: "lyzov/sample/accessories-leather",
    },
  });

  // 3. Level 3: Items (Leaf Categories)
  // Under Men > Clothing:
  const menShirts = await Category.create({
    name: "Shirts",
    slug: "men-clothing-shirts",
    description: "Crisp formal dress shirts and relaxed linen button-downs",
    level: 3,
    parent: menClothing._id,
    ancestors: [
      { _id: menRoot._id, name: menRoot.name, slug: menRoot.slug, level: 1 },
      { _id: menClothing._id, name: menClothing.name, slug: menClothing.slug, level: 2 },
    ],
    displayOrder: 1,
  });

  const menTees = await Category.create({
    name: "T-Shirts & Polos",
    slug: "men-clothing-t-shirts",
    description: "Heavyweight organic tees and classic knit polo shirts",
    level: 3,
    parent: menClothing._id,
    ancestors: [
      { _id: menRoot._id, name: menRoot.name, slug: menRoot.slug, level: 1 },
      { _id: menClothing._id, name: menClothing.name, slug: menClothing.slug, level: 2 },
    ],
    displayOrder: 2,
  });

  const menTrousers = await Category.create({
    name: "Trousers & Chinos",
    slug: "men-clothing-trousers",
    description: "Pleated dress trousers and stretch cotton chinos",
    level: 3,
    parent: menClothing._id,
    ancestors: [
      { _id: menRoot._id, name: menRoot.name, slug: menRoot.slug, level: 1 },
      { _id: menClothing._id, name: menClothing.name, slug: menClothing.slug, level: 2 },
    ],
    displayOrder: 3,
  });

  // Under Men > Footwear:
  const menSneakers = await Category.create({
    name: "Sneakers",
    slug: "men-footwear-sneakers",
    description: "Low-profile minimalist sneakers and daily runners",
    level: 3,
    parent: menFootwear._id,
    ancestors: [
      { _id: menRoot._id, name: menRoot.name, slug: menRoot.slug, level: 1 },
      { _id: menFootwear._id, name: menFootwear.name, slug: menFootwear.slug, level: 2 },
    ],
    displayOrder: 1,
  });

  const menLoafers = await Category.create({
    name: "Loafers & Formal Shoes",
    slug: "men-footwear-loafers",
    description: "Penny loafers and Oxford leather dress shoes",
    level: 3,
    parent: menFootwear._id,
    ancestors: [
      { _id: menRoot._id, name: menRoot.name, slug: menRoot.slug, level: 1 },
      { _id: menFootwear._id, name: menFootwear.name, slug: menFootwear.slug, level: 2 },
    ],
    displayOrder: 2,
  });

  // Under Women > Western Wear:
  const womenDresses = await Category.create({
    name: "Dresses",
    slug: "women-western-dresses",
    description: "Midi dresses, evening gowns, and weekend summer dresses",
    level: 3,
    parent: womenWestern._id,
    ancestors: [
      { _id: womenRoot._id, name: womenRoot.name, slug: womenRoot.slug, level: 1 },
      { _id: womenWestern._id, name: womenWestern.name, slug: womenWestern.slug, level: 2 },
    ],
    displayOrder: 1,
  });

  // Under Accessories:
  const luxuryWatches = await Category.create({
    name: "Chronographs",
    slug: "accessories-timepieces-chronographs",
    description: "Precision chronographs and steel-case analog watches",
    level: 3,
    parent: watchesSub._id,
    ancestors: [
      { _id: accessoriesRoot._id, name: accessoriesRoot.name, slug: accessoriesRoot.slug, level: 1 },
      { _id: watchesSub._id, name: watchesSub.name, slug: watchesSub.slug, level: 2 },
    ],
    displayOrder: 1,
  });

  const walletsBags = await Category.create({
    name: "Wallets & Folios",
    slug: "accessories-leather-wallets",
    description: "Bifold leather wallets, cardholders, and document folios",
    level: 3,
    parent: leatherGoodsSub._id,
    ancestors: [
      { _id: accessoriesRoot._id, name: accessoriesRoot.name, slug: accessoriesRoot.slug, level: 1 },
      { _id: leatherGoodsSub._id, name: leatherGoodsSub.name, slug: leatherGoodsSub.slug, level: 2 },
    ],
    displayOrder: 1,
  });

  console.log("Creating brands...");
  const brands = await Brand.insertMany([
    { name: "LyZov Atelier", description: "In-house luxury Store essentials" },
    { name: "Urban Edge", description: "Streetwear and contemporary tailored fits" },
    { name: "Nimbus", description: "Athletic lifestyle and performance footwear" },
    { name: "Aurora Chrono", description: "Artisanal horology and luxury accessories" },
  ]);

  console.log("Creating sample products with 3-tier categoryPath...");

  const productConfigs = [
    {
      title: "Relaxed Linen Camp Collar Shirt",
      description: "Crafted from pure breathable French linen with a relaxed silhouette and structured camp collar. Ideal for summer layering.",
      shortDescription: "Pure French linen button-down with camp collar.",
      brand: brands[0]._id,
      itemCategory: menShirts,
      image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
      price: 89.99,
      discountPrice: 69.99,
      stock: 45,
      sku: "LZ-SHIRT-001",
      tags: ["linen", "shirt", "summer", "men"],
      isFeatured: true,
      isNewArrival: true,
      isTrending: true,
    },
    {
      title: "Heavyweight Pima Cotton Tee",
      description: "Dense 280 GSM combed Pima cotton designed to retain its drape and structure wash after wash. Features a reinforced crewneck.",
      shortDescription: "Luxurious heavyweight organic Pima cotton t-shirt.",
      brand: brands[1]._id,
      itemCategory: menTees,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
      price: 49.99,
      discountPrice: 39.99,
      stock: 80,
      sku: "LZ-TEE-002",
      tags: ["tee", "cotton", "essential", "casual"],
      isFeatured: true,
      isNewArrival: false,
      isTrending: true,
    },
    {
      title: "Tailored Italian Wool Blend Trousers",
      description: "Single-pleat tailored trousers made from soft Italian stretch wool. Cut with a slight taper for a streamlined, sartorial fit.",
      shortDescription: "Italian wool tailored trousers with slight taper.",
      brand: brands[0]._id,
      itemCategory: menTrousers,
      image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800",
      price: 139.99,
      discountPrice: 119.99,
      stock: 35,
      sku: "LZ-TROUSER-003",
      tags: ["trousers", "wool", "formal", "tailored"],
      isFeatured: false,
      isNewArrival: true,
      isTrending: false,
    },
    {
      title: "Monochrome Minimalist Leather Sneakers",
      description: "Italian calfskin leather upper paired with a stitched Margom rubber cupsole. Timeless aesthetic engineered for all-day comfort.",
      shortDescription: "Full-grain Italian calfskin sneakers with Margom sole.",
      brand: brands[2]._id,
      itemCategory: menSneakers,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
      price: 159.99,
      discountPrice: 134.99,
      stock: 40,
      sku: "LZ-SNEAKER-004",
      tags: ["sneakers", "leather", "footwear", "shoes"],
      isFeatured: true,
      isNewArrival: true,
      isTrending: true,
    },
    {
      title: "Hand-Stitched Penny Loafers",
      description: "Classic Goodyear-welted penny loafers crafted from burnished vegetable-tanned leather. Refined detailing with stacked leather heels.",
      shortDescription: "Goodyear-welted vegetable-tanned penny loafers.",
      brand: brands[0]._id,
      itemCategory: menLoafers,
      image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800",
      price: 189.99,
      discountPrice: 0,
      stock: 25,
      sku: "LZ-LOAFER-005",
      tags: ["loafers", "formal", "leather", "shoes"],
      isFeatured: true,
      isNewArrival: false,
      isTrending: false,
    },
    {
      title: "Silk-Touch Floral Tiered Midi Dress",
      description: "Lightweight silk-blend fabric with a subtle drape and tiered hemline. Features delicate covered buttons and adjustable waist tie.",
      shortDescription: "Tiered silk-blend midi dress with floral motifs.",
      brand: brands[1]._id,
      itemCategory: womenDresses,
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800",
      price: 129.99,
      discountPrice: 99.99,
      stock: 30,
      sku: "LZ-DRESS-006",
      tags: ["dress", "women", "summer", "silk"],
      isFeatured: true,
      isNewArrival: true,
      isTrending: true,
    },
    {
      title: "Sub-Second Automatic Steel Chronograph",
      description: "Surgical-grade 316L stainless steel case featuring an exhibition caseback, sapphire crystal with anti-reflective coating, and Japanese automatic movement.",
      shortDescription: "Automatic movement chronograph with sapphire crystal.",
      brand: brands[3]._id,
      itemCategory: luxuryWatches,
      image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800",
      price: 299.99,
      discountPrice: 249.99,
      stock: 20,
      sku: "LZ-WATCH-007",
      tags: ["watch", "chronograph", "steel", "luxury"],
      isFeatured: true,
      isNewArrival: false,
      isTrending: true,
    },
    {
      title: "Full-Grain Leather Bifold Cardholder Wallet",
      description: "Handcrafted using vegetable-tanned bridle leather with hand-waxed edges. Holds up to 8 cards plus folded banknotes.",
      shortDescription: "Vegetable-tanned bridle leather slim bifold wallet.",
      brand: brands[0]._id,
      itemCategory: walletsBags,
      image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800",
      price: 64.99,
      discountPrice: 49.99,
      stock: 60,
      sku: "LZ-WALLET-008",
      tags: ["wallet", "leather", "cardholder", "accessories"],
      isFeatured: false,
      isNewArrival: true,
      isTrending: true,
    },
  ];

  for (const cfg of productConfigs) {
    const categoryPath = [
      ...cfg.itemCategory.ancestors.map((a) => a._id),
      cfg.itemCategory._id,
    ];

    await Product.create({
      title: cfg.title,
      description: cfg.description,
      shortDescription: cfg.shortDescription,
      brand: cfg.brand,
      category: cfg.itemCategory._id,
      categoryPath: categoryPath,
      images: [
        {
          url: cfg.image,
          publicId: `lyzov/sample/${cfg.sku.toLowerCase()}`,
          altText: cfg.title,
        },
      ],
      price: cfg.price,
      discountPrice: cfg.discountPrice,
      stock: cfg.stock,
      sku: cfg.sku,
      tags: cfg.tags,
      isFeatured: cfg.isFeatured,
      isNewArrival: cfg.isNewArrival,
      isTrending: cfg.isTrending,
      ratingsAverage: 4.8,
      ratingsCount: 18,
    });
  }

  console.log("Seeding complete!");
  console.log("Seller login -> email: seller@lyzov.com | password: Admin@1234");
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});