const test = require("node:test");
const assert = require("node:assert");
const {
  SHIPPING_PLATFORMS,
  buildTrackingUrl,
  buildDefaultShipmentEmailText,
} = require("../config/shippingPlatforms");
const emailTemplates = require("../utils/emailTemplates");
const emailService = require("../services/emailService");

test("Shipment Tracking Flow — Platform tracking URL generation", () => {
  const delhiveryUrl = buildTrackingUrl("delhivery", "123456789");
  assert.strictEqual(delhiveryUrl, "https://www.delhivery.com/track/package/123456789");

  const bluedartUrl = buildTrackingUrl("bluedart", "BD98765");
  assert.strictEqual(bluedartUrl, "https://www.bluedart.com/web/guest/trackdartresult?trackNo=BD98765");

  const dtdcUrl = buildTrackingUrl("dtdc", "DT112233");
  assert.strictEqual(dtdcUrl, "https://www.dtdc.in/tracking.asp?strCnno=DT112233");

  const customUrl = buildTrackingUrl("other", "123", "https://customcourier.com/track/123");
  assert.strictEqual(customUrl, "https://customcourier.com/track/123");
});

test("Shipment Tracking Flow — Default email body builder", () => {
  const text = buildDefaultShipmentEmailText({
    recipientName: "John Doe",
    orderNumber: "ORD-9901",
    platformLabel: "Blue Dart",
    trackingNumber: "BD990112",
    trackingUrl: "https://www.bluedart.com/web/guest/trackdartresult?trackNo=BD990112",
  });

  assert.ok(text.includes("Hello John Doe,"));
  assert.ok(text.includes("ORD-9901"));
  assert.ok(text.includes("Blue Dart"));
  assert.ok(text.includes("BD990112"));
  assert.ok(text.includes("https://www.bluedart.com/web/guest/trackdartresult?trackNo=BD990112"));
});

test("Shipment Tracking Flow — HTML email template generation with custom seller body", () => {
  const { subject, html, text } = emailTemplates.shipmentTrackingTemplate({
    order: { _id: "order_123", orderNumber: "ORD-9901", shippingAddress: { fullName: "John Doe" } },
    user: { name: "John Doe" },
    platformLabel: "Delhivery",
    trackingNumber: "142371908234",
    trackingUrl: "https://www.delhivery.com/track/package/142371908234",
    emailBody: "Your order has been hand-packed with care.\nExpected delivery within 3 days.",
    emailSubject: "Custom Subject: Order ORD-9901 is on its way!",
  });

  assert.strictEqual(subject, "Custom Subject: Order ORD-9901 is on its way!");
  assert.ok(html.includes("142371908234"));
  assert.ok(html.includes("Delhivery"));
  assert.ok(html.includes("Your order has been hand-packed with care."));
  assert.ok(html.includes("Expected delivery within 3 days."));
  assert.ok(html.includes("https://www.delhivery.com/track/package/142371908234"));
});

test("Shipment Tracking Flow — emailService dispatch", async () => {
  let dispatchedMail = null;

  // Temporarily override dispatch for testing
  const originalDispatch = emailService.dispatch;
  emailService.dispatch = async (opts) => {
    dispatchedMail = opts;
    return { success: true, simulated: true };
  };

  try {
    const res = await emailService.sendShipmentTrackingEmail({
      order: { _id: "ord_1", orderNumber: "10042", shippingAddress: { fullName: "Rahul" } },
      user: { name: "Rahul", email: "rahul@example.com" },
      platformLabel: "DTDC",
      trackingNumber: "DTDC-5544",
      trackingUrl: "https://www.dtdc.in/tracking.asp?strCnno=DTDC-5544",
      emailBody: "Thank you for shopping with LyZov!",
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(dispatchedMail.to, "rahul@example.com");
    assert.strictEqual(dispatchedMail.template, "shipment_tracking");
    assert.ok(dispatchedMail.html.includes("DTDC-5544"));
  } finally {
    emailService.dispatch = originalDispatch;
  }
});
