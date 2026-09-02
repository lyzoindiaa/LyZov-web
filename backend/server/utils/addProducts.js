const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Category = require("../models/Category");
const Brand = require("../models/Brand");
const Product = require("../models/Product");

const productsToAdd = [
  {
    title: "Relaxed Linen Shirt",
    description: "A breathable linen shirt with a relaxed fit for warm days and easy layering.",
    shortDescription: "Breathable linen comfort for everyday style.",
    category: "Men",
    brand: "Urban Edge",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
    price: 69.99,
    discountPrice: 54.99,
    tags: ["linen", "shirt", "summer"],
  },
  {
    title: "Printed Midi Dress",
    description: "A flowing midi dress with a vibrant print, soft drape, and comfortable all-day fit.",
    shortDescription: "A colorful midi dress for effortless occasions.",
    category: "Women",
    brand: "Nova Essentials",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800",
    price: 84.99,
    discountPrice: 69.99,
    tags: ["dress", "printed", "women"],
  },
  {
    title: "Everyday Leather Sneakers",
    description: "Clean low-top sneakers made for comfortable walks, commutes, and daily wear.",
    shortDescription: "Versatile sneakers with everyday comfort.",
    category: "Footwear",
    brand: "Nimbus",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    price: 94.99,
    discountPrice: 79.99,
    tags: ["sneakers", "casual", "footwear"],
  },
  {
    title: "Slim Metal Chronograph",
    description: "A refined chronograph watch with a slim metal case and an easy-to-read dial.",
    shortDescription: "A polished chronograph for modern wardrobes.",
    category: "Accessories",
    brand: "Aurora",
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800",
    price: 129.99,
    discountPrice: 109.99,
    tags: ["watch", "chronograph", "accessories"],
  },
  {
    title: "Compact Travel Backpack",
    description: "A lightweight backpack with organized storage for workdays, short trips, and commutes.",
    shortDescription: "Organized carry for work and travel.",
    category: "Accessories",
    brand: "Urban Edge",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
    price: 74.99,
    discountPrice: 59.99,
    tags: ["backpack", "travel", "carry"],
  },
  {
    title: "Wireless Noise Cancelling Headphones",
    description: "Comfortable wireless headphones with rich sound and focused noise cancellation.",
    shortDescription: "Immersive sound for focused listening.",
    category: "Electronics",
    brand: "Nimbus",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    price: 159.99,
    discountPrice: 129.99,
    tags: ["headphones", "wireless", "audio"],
  },
  {
    title: "Minimal Ceramic Table Lamp",
    description: "A warm ceramic table lamp that adds a soft glow and calm character to any room.",
    shortDescription: "Soft ambient lighting with a clean silhouette.",
    category: "Home Decor",
    brand: "Nova Essentials",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
    price: 64.99,
    discountPrice: 49.99,
    tags: ["lamp", "ceramic", "decor"],
  },
  {
    title: "Hydrating Daily Face Set",
    description: "A simple daily skincare set with gentle essentials for a fresh, hydrated feel.",
    shortDescription: "Gentle daily care for hydrated skin.",
    category: "Women",
    brand: "Aurora",
    image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=800",
    price: 44.99,
    discountPrice: 36.99,
    tags: ["skincare", "beauty", "hydration"],
  },
  {
    title: "Lightweight Training Joggers",
    description: "Stretch training joggers with a tapered fit for workouts, travel, and relaxed days.",
    shortDescription: "Flexible joggers built for movement.",
    category: "Men",
    brand: "Nimbus",
    image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800",
    price: 59.99,
    discountPrice: 44.99,
    tags: ["joggers", "training", "activewear"],
  },
  {
    title: "Classic Canvas Slip Ons",
    description: "Easy canvas slip-on shoes with a flexible sole for simple everyday styling.",
    shortDescription: "Easy slip-ons for everyday comfort.",
    category: "Footwear",
    brand: "Nova Essentials",
    image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800",
    price: 54.99,
    discountPrice: 39.99,
    tags: ["canvas", "slip-ons", "casual"],
  },
];

const addProducts = async () => {
  await connectDB();

  const [categories, brands] = await Promise.all([Category.find(), Brand.find()]);
  const categoryMap = new Map(categories.map((category) => [category.name, category._id]));
  const brandMap = new Map(brands.map((brand) => [brand.name, brand._id]));

  const missingBrands = productsToAdd.filter((product) => !brandMap.has(product.brand));
  if (!categories.length || missingBrands.length) {
    throw new Error("Required categories or brands are missing. Run the main seed first.");
  }

  const skus = productsToAdd.map((_, index) => `LYZOV-ADD-${2000 + index}`);
  const existing = await Product.find({ sku: { $in: skus } }, { sku: 1 }).lean();
  const existingSkus = new Set(existing.map((product) => product.sku));

  const newProducts = productsToAdd
    .map((product, index) => ({
      ...product,
      brand: brandMap.get(product.brand),
      category: categoryMap.get(product.category) || categories[index % categories.length]._id,
      images: [{ url: product.image, publicId: `lyzov/sample/add-${index}`, altText: product.title }],
      sku: skus[index],
      stock: 25 + index * 5,
      isFeatured: index % 4 === 0,
      isNewArrival: true,
      isTrending: index % 3 === 0,
    }))
    .filter((product) => !existingSkus.has(product.sku));

  if (newProducts.length) {
    await Product.insertMany(newProducts);
  }

  console.log(`Added ${newProducts.length} product(s); ${existingSkus.size} already existed.`);
  await mongoose.disconnect();
};

addProducts().catch(async (error) => {
  console.error("Adding products failed:", error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
