const Razorpay = require("razorpay");
const ApiError = require("../utils/ApiError");

let client = null;

const getKeyId = () => (process.env.RAZORPAY_KEY_ID || "").trim();
const getKeySecret = () => (process.env.RAZORPAY_KEY_SECRET || "").trim();
const getWebhookSecret = () => (process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();

const isLiveKey = (keyId = getKeyId()) => /^rzp_live_/.test(keyId);
const isTestKey = (keyId = getKeyId()) => /^rzp_test_/.test(keyId);

const isConfigured = () => Boolean(getKeyId() && getKeySecret());

/**
 * Live/test guard (closes the "test payment bypass"):
 *  - production requires a live key (unless RAZORPAY_ALLOW_TEST_MODE=true, meant for staging only)
 *  - non-production requires a test key so development never charges real money
 */
const assertKeyModeMatchesEnvironment = () => {
  const keyId = getKeyId();
  if (!isLiveKey(keyId) && !isTestKey(keyId)) {
    throw ApiError.internal("Razorpay key id is malformed. Expected rzp_live_* or rzp_test_*.");
  }

  const isProduction = process.env.NODE_ENV === "production";
  const allowTestInProd = process.env.RAZORPAY_ALLOW_TEST_MODE === "true";

  if (isProduction && !isLiveKey(keyId) && !allowTestInProd) {
    throw ApiError.internal(
      "Online payments are disabled: production requires live Razorpay keys (rzp_live_*)."
    );
  }
  if (!isProduction && isLiveKey(keyId)) {
    throw ApiError.internal(
      "Online payments are disabled: live Razorpay keys must not be used outside production."
    );
  }
};

const getRazorpay = () => {
  if (!isConfigured()) {
    throw ApiError.internal("Online payments are not configured. Please use Cash on Delivery.");
  }
  assertKeyModeMatchesEnvironment();

  if (!client) {
    client = new Razorpay({ key_id: getKeyId(), key_secret: getKeySecret() });
  }
  return client;
};

module.exports = {
  getRazorpay,
  getKeyId,
  getKeySecret,
  getWebhookSecret,
  isConfigured,
  isLiveKey,
  assertKeyModeMatchesEnvironment,
};
