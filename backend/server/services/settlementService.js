const mongoose = require("mongoose");
const Payout = require("../models/Payout");
const SubOrder = require("../models/SubOrder");
const User = require("../models/User");

const COOLING_OFF_WINDOW_DAYS = 7;

/**
 * Handles order delivery transition:
 * Moves subOrder & linked payout from "pending" to "cooling_off",
 * starting the 7-day return/exchange window timer.
 */
async function handleSubOrderDelivery({ subOrder, deliveredAt = new Date() }) {
  if (!subOrder) return null;

  const coolingOffUntil = new Date(
    deliveredAt.getTime() + COOLING_OFF_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  subOrder.isDelivered = true;
  subOrder.deliveredAt = deliveredAt;
  subOrder.coolingOffUntil = coolingOffUntil;
  subOrder.payoutStatus = "cooling_off";

  if (subOrder.payoutId) {
    await Payout.findByIdAndUpdate(subOrder.payoutId, {
      $set: {
        status: "cooling_off",
        coolingOffStartedAt: deliveredAt,
        eligibleAt: coolingOffUntil,
      },
    });
  }

  return { subOrder, coolingOffUntil };
}

/**
 * Handles subOrder cancellation or refund:
 * Marks the associated payout as "refunded" to void settlement.
 */
async function handleSubOrderCancellation({ subOrder, reason = "" }) {
  if (!subOrder) return null;

  subOrder.payoutStatus = "refunded";

  if (subOrder.payoutId) {
    await Payout.findByIdAndUpdate(subOrder.payoutId, {
      $set: {
        status: "refunded",
        notes: reason || "Voided due to order cancellation/refund",
      },
    });
  }

  return subOrder;
}

/**
 * Cron/Scheduled worker to promote matured cooling-off payouts to eligible.
 * Any payout whose 7-day return window has elapsed without return becomes eligible.
 */
async function promoteMaturedCoolingOffPayouts() {
  const now = new Date();
  const filter = {
    status: "cooling_off",
    eligibleAt: { $lte: now },
  };

  const maturedPayouts = await Payout.find(filter);
  if (!maturedPayouts || maturedPayouts.length === 0) {
    return { promotedCount: 0 };
  }

  let promotedCount = 0;
  for (const payout of maturedPayouts) {
    payout.status = "eligible";
    await payout.save();

    if (payout.subOrder) {
      await SubOrder.findByIdAndUpdate(payout.subOrder, {
        $set: { payoutStatus: "eligible" },
      });
    }
    promotedCount++;
  }

  return { promotedCount };
}

/**
 * Aggregates monthly settlement totals for all eligible sellers for a given period (YYYY-MM).
 */
async function getMonthlySettlementBatch({ period, sellerId = null }) {
  const matchFilter = {
    status: { $in: ["eligible", "completed"] },
  };

  if (period) {
    matchFilter.settlementPeriod = period;
  }
  if (sellerId && mongoose.isValidObjectId(sellerId)) {
    matchFilter.seller = new mongoose.Types.ObjectId(sellerId);
  }

  const aggregates = await Payout.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: "$seller",
        orderCount: { $sum: 1 },
        totalGross: { $sum: "$grossAmount" },
        totalCommission: { $sum: "$commissionAmount" },
        totalGstOnCommission: { $sum: "$gstOnCommission" },
        totalTcs: { $sum: "$tcsAmount" },
        totalNet: { $sum: "$netAmount" },
        payoutIds: { $push: "$_id" },
        hasPendingEligible: {
          $sum: { $cond: [{ $eq: ["$status", "eligible"] }, 1, 0] },
        },
      },
    },
    { $sort: { totalNet: -1 } },
  ]);

  // Populate seller details
  const populated = await Promise.all(
    aggregates.map(async (row) => {
      const seller = await User.findById(row._id).select(
        "name email sellerProfile.businessName sellerProfile.storeSlug sellerProfile.bankDetails"
      );
      return {
        sellerId: row._id,
        sellerName: seller?.name || "Unknown Seller",
        businessName: seller?.sellerProfile?.businessName || seller?.name || "Merchant",
        email: seller?.email || "",
        bankDetails: seller?.sellerProfile?.bankDetails || {},
        orderCount: row.orderCount,
        hasPendingEligible: row.hasPendingEligible > 0,
        totalGross: Math.round(row.totalGross * 100) / 100,
        totalCommission: Math.round(row.totalCommission * 100) / 100,
        totalGstOnCommission: Math.round(row.totalGstOnCommission * 100) / 100,
        totalTcs: Math.round(row.totalTcs * 100) / 100,
        totalNet: Math.round(row.totalNet * 100) / 100,
        payoutIds: row.payoutIds,
      };
    })
  );

  return populated;
}

/**
 * Releases a monthly settlement batch for a seller or entire period with a Bank UTR reference.
 */
async function releaseMonthlySettlementBatch({
  period,
  sellerId = null,
  utrNumber,
  processedBy,
  notes = "",
}) {
  if (!utrNumber || !String(utrNumber).trim()) {
    throw new Error("Bank UTR reference number is required to confirm settlement");
  }

  const filter = {
    status: "eligible",
  };
  if (period) filter.settlementPeriod = period;
  if (sellerId && mongoose.isValidObjectId(sellerId)) {
    filter.seller = sellerId;
  }

  const eligiblePayouts = await Payout.find(filter);
  if (!eligiblePayouts || eligiblePayouts.length === 0) {
    return { releasedCount: 0, totalAmount: 0 };
  }

  const batchId = `BATCH-${period || "SETTLE"}-${Date.now()}`;
  let totalAmount = 0;
  const subOrderIds = [];

  for (const payout of eligiblePayouts) {
    payout.status = "completed";
    payout.utrNumber = String(utrNumber).trim();
    payout.transactionReference = String(utrNumber).trim();
    payout.batchId = batchId;
    payout.batchReleasedAt = new Date();
    payout.paidAt = new Date();
    payout.processedBy = processedBy;
    payout.notes = notes || `Released in monthly batch ${batchId}`;
    await payout.save();

    totalAmount += payout.netAmount || 0;
    if (payout.subOrder) subOrderIds.push(payout.subOrder);
  }

  if (subOrderIds.length > 0) {
    await SubOrder.updateMany(
      { _id: { $in: subOrderIds } },
      { $set: { payoutStatus: "paid" } }
    );
  }

  return {
    batchId,
    utrNumber,
    releasedCount: eligiblePayouts.length,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}

/**
 * Generates an RBI standard CSV string for bulk NEFT bank uploads.
 */
function generateBankNeftCsv(batchRows, period = "") {
  const headers = [
    "Beneficiary Name",
    "Account Number",
    "IFSC Code",
    "Bank Name",
    "Payout Amount (INR)",
    "Payment Narration",
    "Settlement Period",
    "Order Count",
  ];

  const escapeCsv = (val) => {
    const s = String(val ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = batchRows.map((r) => [
    escapeCsv(r.bankDetails?.accountHolderName || r.businessName),
    escapeCsv(r.bankDetails?.accountNumber || ""),
    escapeCsv(r.bankDetails?.ifscCode || ""),
    escapeCsv(r.bankDetails?.bankName || "NEFT"),
    r.totalNet.toFixed(2),
    escapeCsv(`LyZov Settlement ${period || r.businessName}`),
    escapeCsv(period || "Current"),
    r.orderCount,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

module.exports = {
  COOLING_OFF_WINDOW_DAYS,
  handleSubOrderDelivery,
  handleSubOrderCancellation,
  promoteMaturedCoolingOffPayouts,
  getMonthlySettlementBatch,
  releaseMonthlySettlementBatch,
  generateBankNeftCsv,
};
