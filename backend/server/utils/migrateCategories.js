const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Category = require("../models/Category");
const Product = require("../models/Product");

const migrate = async () => {
  await connectDB();
  console.log("Starting category and product taxonomy migration...");

  // 1. Migrate categories
  const categories = await Category.find();
  console.log(`Found ${categories.length} categories to check.`);

  for (const cat of categories) {
    let changed = false;

    if (!cat.parent) {
      if (cat.level !== 1) {
        cat.level = 1;
        changed = true;
      }
      if (!cat.ancestors || cat.ancestors.length > 0) {
        cat.ancestors = [];
        changed = true;
      }
    } else {
      const parentDoc = await Category.findById(cat.parent);
      if (parentDoc) {
        const expectedLevel = Math.min((parentDoc.level || 1) + 1, 3);
        const expectedAncestors = [
          ...(parentDoc.ancestors || []),
          {
            _id: parentDoc._id,
            name: parentDoc.name,
            slug: parentDoc.slug,
            level: parentDoc.level || 1,
          },
        ];
        cat.level = expectedLevel;
        cat.ancestors = expectedAncestors;
        changed = true;
      }
    }

    if (changed) {
      await cat.save();
      console.log(`Updated category: ${cat.name} (Level ${cat.level})`);
    }
  }

  // 2. Migrate products categoryPath
  const products = await Product.find();
  console.log(`Found ${products.length} products to check.`);

  for (const prod of products) {
    if (!prod.category) continue;

    const catDoc = await Category.findById(prod.category);
    if (catDoc) {
      const pathIds = [
        ...(catDoc.ancestors || []).map((a) => a._id),
        catDoc._id,
      ];
      prod.categoryPath = pathIds;
      await prod.save();
      console.log(`Updated product: ${prod.title} with categoryPath:`, pathIds);
    } else if (!prod.categoryPath || prod.categoryPath.length === 0) {
      prod.categoryPath = [prod.category];
      await prod.save();
    }
  }

  console.log("Migration complete!");
  process.exit(0);
};

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
