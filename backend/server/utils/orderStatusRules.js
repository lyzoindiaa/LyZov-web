const ApiError = require("./ApiError");

const FORWARD_STATUSES = ["pending", "processing", "shipped", "delivered"];

/**
 * Active fulfillment statuses cannot move backward (e.g. processing → pending).
 * Cancelled/refunded are handled separately.
 */
function assertForwardStatusTransition(prevStatus, nextStatus) {
  if (!nextStatus || prevStatus === nextStatus) return;

  const fromIdx = FORWARD_STATUSES.indexOf(prevStatus);
  const toIdx = FORWARD_STATUSES.indexOf(nextStatus);

  if (fromIdx === -1 || toIdx === -1) return;

  if (toIdx < fromIdx) {
    throw ApiError.badRequest(
      `Cannot revert order from "${prevStatus}" to "${nextStatus}". Orders only move forward through pending → processing → shipped → delivered.`
    );
  }
}
module.exports = {
  FORWARD_STATUSES,
  assertForwardStatusTransition,
};
