const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

/**
 * Atomically deduct stock for an array of order/cart items.
 * If any item lacks sufficient stock, all previously deducted items in this batch are rolled back.
 */
const deductStockForItems = async (items) => {
  const deducted = [];

  for (const item of items) {
    const qty = Number(item.quantity);
    let updatedProduct = null;

    if (item.variantId) {
      updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product,
          isActive: true,
          "variants._id": item.variantId,
          "variants.stock": { $gte: qty },
        },
        {
          $inc: {
            "variants.$.stock": -qty,
            numSold: qty,
          },
        },
        { new: true }
      );
    } else {
      updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product,
          isActive: true,
          stock: { $gte: qty },
        },
        {
          $inc: {
            stock: -qty,
            numSold: qty,
          },
        },
        { new: true }
      );
    }

    if (!updatedProduct) {
      // Rollback all items deducted in this batch
      for (const d of deducted) {
        if (d.variantId) {
          await Product.findOneAndUpdate(
            { _id: d.product, "variants._id": d.variantId },
            { $inc: { "variants.$.stock": d.quantity, numSold: -d.quantity } }
          );
        } else {
          await Product.findByIdAndUpdate(d.product, {
            $inc: { stock: d.quantity, numSold: -d.quantity },
          });
        }
      }

      throw ApiError.badRequest(
        `Insufficient stock for item "${item.name || "selected product"}". Please update your cart.`
      );
    }

    deducted.push({
      product: item.product,
      variantId: item.variantId || null,
      quantity: qty,
    });
  }

  return deducted;
};

/**
 * Restore stock and decrement numSold when an order is cancelled or refunded.
 */
const restoreStockForItems = async (items) => {
  if (!items || !items.length) return;

  for (const item of items) {
    const qty = Number(item.quantity);
    if (item.variantId) {
      await Product.findOneAndUpdate(
        { _id: item.product, "variants._id": item.variantId },
        { $inc: { "variants.$.stock": qty, numSold: -qty } }
      );
    } else {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: qty, numSold: -qty },
      });
    }
  }
};

module.exports = { deductStockForItems, restoreStockForItems };
