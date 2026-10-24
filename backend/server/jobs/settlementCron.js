const { promoteMaturedCoolingOffPayouts } = require("../services/settlementService");

let cronInterval = null;

/**
 * Executes a single maturity run.
 */
async function runSettlementMaturityJob() {
  try {
    const result = await promoteMaturedCoolingOffPayouts();
    if (result.promotedCount > 0) {
      console.log(
        `[SettlementCron] Successfully promoted ${result.promotedCount} matured payout(s) to eligible.`
      );
    }
    return result;
  } catch (err) {
    console.error("[SettlementCron] Error running settlement maturity job:", err.message);
    return { promotedCount: 0, error: err.message };
  }
}

/**
 * Initializes recurring background settlement scheduler.
 * Defaults to running every hour (3600000ms).
 */
function startSettlementScheduler(intervalMs = 60 * 60 * 1000) {
  if (cronInterval) clearInterval(cronInterval);

  // Run initial check on server startup (delayed by 10s to ensure DB is connected)
  setTimeout(() => {
    runSettlementMaturityJob().catch(() => {});
  }, 10000);

  cronInterval = setInterval(() => {
    runSettlementMaturityJob().catch(() => {});
  }, intervalMs);

  console.log(`[SettlementCron] Settlement maturity scheduler initialized (interval: ${intervalMs / 1000}s)`);
}

function stopSettlementScheduler() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
  }
}

module.exports = {
  runSettlementMaturityJob,
  startSettlementScheduler,
  stopSettlementScheduler,
};
