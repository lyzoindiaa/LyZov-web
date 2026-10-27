const CommissionRule = require("../models/CommissionRule");

/**
 * Rounds a number to 2 decimal places.
 */
function round2(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a Date object to YYYY-MM settlement period string.
 */
function getSettlementPeriod(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Resolves the applicable commission rule for a seller and optional category.
 * Priority:
 * 1. Seller-specific custom rule
 * 2. Category-specific rule
 * 3. Global active rule
 * 4. Seller profile commissionRate or fallback 10%
 */
async function resolveCommissionRule({ sellerId, categoryId, fallbackRate = 10, targetDate = new Date() }) {
  try {
    if (!CommissionRule.db || CommissionRule.db.readyState !== 1) {
      return {
        name: "Default Seller Profile Tier",
        scope: "seller_profile",
        rateType: "percentage",
        percentage: Number(fallbackRate) || 10,
        fixedFee: 0,
        gstOnCommissionRate: 0,
        tcsRate: 0,
      };
    }

    const checkDate = new Date(targetDate);
    const dateQuery = {
      $or: [
        { effectiveFrom: { $lte: checkDate } },
        { effectiveFrom: null },
        { effectiveFrom: { $exists: false } },
      ],
      $and: [
        {
          $or: [
            { effectiveTo: null },
            { effectiveTo: { $exists: false } },
            { effectiveTo: { $gte: checkDate } },
          ],
        },
      ],
    };

    // 1. Check Seller custom rule (latest effective date first)
    if (sellerId) {
      const sellerRule = await CommissionRule.findOne({
        scope: "seller",
        seller: sellerId,
        isActive: true,
        ...dateQuery,
      }).sort({ effectiveFrom: -1, createdAt: -1 });
      if (sellerRule) return sellerRule;
    }

    // 2. Check Category custom rule (latest effective date first)
    if (categoryId) {
      const categoryRule = await CommissionRule.findOne({
        scope: "category",
        category: categoryId,
        isActive: true,
        ...dateQuery,
      }).sort({ effectiveFrom: -1, createdAt: -1 });
      if (categoryRule) return categoryRule;
    }

    // 3. Check Global rule (latest effective date first)
    const globalRule = await CommissionRule.findOne({
      scope: "global",
      isActive: true,
      ...dateQuery,
    }).sort({ effectiveFrom: -1, createdAt: -1 });
    if (globalRule) return globalRule;
  } catch (err) {
    console.error("[commissionService] Error fetching commission rule:", err.message);
  }

  // 4. Default fallback (maintains backward compatibility with sellerProfile.commissionRate)
  return {
    name: "Default Seller Profile Tier",
    scope: "seller_profile",
    rateType: "percentage",
    percentage: Number(fallbackRate) || 10,
    fixedFee: 0,
    gstOnCommissionRate: 0,
    tcsRate: 0,
  };
}

/**
 * Calculates financial breakdown for a SubOrder given items price and resolved rule.
 *
 * Math:
 * commissionAmount = (itemsPrice * rate / 100) + fixedFee
 * gstOnCommission = commissionAmount * 18%
 * tcsAmount = itemsPrice * 1%
 * netSellerEarnings = sellerTotal - commissionAmount - gstOnCommission - tcsAmount
 */
function calculateSubOrderFinancials({
  sellerItemsPrice,
  sellerTotal,
  rule,
}) {
  const percentage = Number(rule.percentage) || 10;
  const fixedFee = Number(rule.fixedFee) || 0;
  const gstRate = rule.gstOnCommissionRate !== undefined ? Number(rule.gstOnCommissionRate) : 18.0;
  const tcsRate = rule.tcsRate !== undefined ? Number(rule.tcsRate) : 1.0;

  const baseCommission = round2((sellerItemsPrice * percentage) / 100) + round2(fixedFee);
  const gstOnCommission = round2((baseCommission * gstRate) / 100);
  const tcsAmount = round2((sellerItemsPrice * tcsRate) / 100);

  const totalDeductions = round2(baseCommission + gstOnCommission + tcsAmount);
  const sellerEarnings = round2(Math.max(sellerTotal - totalDeductions, 0));

  return {
    commissionRate: percentage,
    fixedFee,
    commissionAmount: baseCommission,
    gstOnCommission,
    tcsAmount,
    totalDeductions,
    sellerEarnings,
    settlementPeriod: getSettlementPeriod(),
    ruleSnapshot: {
      name: rule.name || "Default Platform Tier",
      scope: rule.scope || "global",
      percentage,
      fixedFee,
      gstOnCommissionRate: gstRate,
      tcsRate,
    },
  };
}

module.exports = {
  round2,
  getSettlementPeriod,
  resolveCommissionRule,
  calculateSubOrderFinancials,
};
