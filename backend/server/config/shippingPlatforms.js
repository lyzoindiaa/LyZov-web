/**
 * Manual courier platforms — seller ships outside the app, then enters AWB + link here.
 */
const SHIPPING_PLATFORMS = [
  {
    id: "delhivery",
    label: "Delhivery",
    trackingUrlTemplate: "https://www.delhivery.com/track/package/{awb}",
  },
  {
    id: "bluedart",
    label: "Blue Dart",
    trackingUrlTemplate: "https://www.bluedart.com/web/guest/trackdartresult?trackNo={awb}",
  },
  {
    id: "dtdc",
    label: "DTDC",
    trackingUrlTemplate: "https://www.dtdc.in/tracking.asp?strCnno={awb}",
  },
  {
    id: "indiapost",
    label: "India Post",
    trackingUrlTemplate: "https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?consignment={awb}",
  },
  {
    id: "ekart",
    label: "Ekart / Flipkart Logistics",
    trackingUrlTemplate: "",
  },
  {
    id: "other",
    label: "Other (custom link)",
    trackingUrlTemplate: "",
  },
];

function getPlatformById(id) {
  return SHIPPING_PLATFORMS.find((p) => p.id === id) || null;
}

function buildTrackingUrl(platformId, awb, customUrl = "") {
  const trimmedAwb = String(awb || "").trim();
  const trimmedCustom = String(customUrl || "").trim();
  if (trimmedCustom) return trimmedCustom;

  const platform = getPlatformById(platformId);
  if (!platform?.trackingUrlTemplate || !trimmedAwb) return trimmedCustom;

  return platform.trackingUrlTemplate.replace(/\{awb\}/gi, encodeURIComponent(trimmedAwb));
}

function buildDefaultShipmentEmailText({
  recipientName,
  orderNumber,
  platformLabel,
  trackingNumber,
  trackingUrl,
}) {
  const name = recipientName || "Valued Customer";
  const lines = [
    `Hello ${name},`,
    "",
    `Your LyZov order #${orderNumber} has been dispatched.`,
    "",
    `Courier / platform: ${platformLabel || "Our shipping partner"}`,
    `Tracking / AWB ID: ${trackingNumber}`,
  ];
  if (trackingUrl) {
    lines.push(`Track your shipment: ${trackingUrl}`);
  }
  lines.push(
    "",
    "You can also view order progress anytime from your LyZov account or our Track Order page.",
    "",
    "Thank you for choosing LyZov."
  );
  return lines.join("\n");
}

module.exports = {
  SHIPPING_PLATFORMS,
  getPlatformById,
  buildTrackingUrl,
  buildDefaultShipmentEmailText,
};
