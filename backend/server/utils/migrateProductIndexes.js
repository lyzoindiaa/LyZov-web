const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectDB = require("../config/db");
const Product = require("../models/Product");

const migrateProductIndexes = async () => {
  await connectDB();

  const indexes = await Product.collection.indexes();
  const oldTextIndex = indexes.find((index) => index.key?._fts === "text");
  if (oldTextIndex) {
    await Product.collection.dropIndex(oldTextIndex.name);
  }

  await Product.syncIndexes();
  const existingProducts = await Product.find({ lyId: /^LYZOV-\d+$/ }).select("lyId").lean();
  let nextLyNumber = existingProducts.reduce((max, product) => {
    const number = Number(product.lyId.replace("LYZOV-", ""));
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);

  const productsWithoutLyId = await Product.find({
    $or: [{ lyId: { $exists: false } }, { lyId: null }, { lyId: "" }],
  }).select("_id").sort({ _id: 1 });

  for (const product of productsWithoutLyId) {
    nextLyNumber += 1;
    await Product.updateOne(
      { _id: product._id },
      { $set: { lyId: `LYZOV-${String(nextLyNumber).padStart(6, "0")}` } }
    );
  }

  console.log(`Assigned LY IDs to ${productsWithoutLyId.length} existing products.`);
  console.log("Product indexes synchronized.");
  process.exit(0);
};

migrateProductIndexes().catch((error) => {
  console.error(`Product index migration failed: ${error.message}`);
  process.exit(1);
});
