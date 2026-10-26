const express = require("express");
const { runSettlementMaturityJob } = require("../jobs/settlementCron");
const { sendSuccess } = require("../utils/apiResponse");
const ApiError = require("../utils/ApiError");

const router = express.Router();

/**
 * Middleware verifying cron invocation authorization.
 * Accepts:
 *  - Authorization: Bearer <CRON_SECRET>
 *  - x-cron-key header
 *  - ?key= query parameter
 *  - Vercel's internal cron header: x-vercel-cron (when deployed on Vercel)
 */
const verifyCronAuth = (req, res, next) => {
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = req.headers["x-vercel-cron"] === "1";

  if (isVercelCron) {
    return next();
  }

  if (cronSecret) {
    const authHeader = req.headers.authorization;
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const customHeader = req.headers["x-cron-key"];
    const queryKey = req.query.key;

    if (bearer !== cronSecret && customHeader !== cronSecret && queryKey !== cronSecret) {
      throw ApiError.unauthorized("Unauthorized cron request: invalid secret");
    }
  } else if (process.env.NODE_ENV === "production") {
    // In production without secret, reject unauthorized access unless local test
    throw ApiError.unauthorized("CRON_SECRET is not configured on the server");
  }

  next();
};

// @desc    Process matured cooling-off payouts (run by Vercel cron, GitHub Actions, or external scheduler)
// @route   POST /api/cron/process-settlements
// @route   GET /api/cron/process-settlements
router.all("/process-settlements", verifyCronAuth, async (req, res, next) => {
  try {
    const result = await runSettlementMaturityJob();
    return sendSuccess(res, 200, "Settlement maturity job executed successfully", {
      executedAt: new Date(),
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
