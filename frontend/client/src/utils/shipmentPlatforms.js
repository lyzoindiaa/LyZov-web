/** Mirrors backend shippingPlatforms — used for URL hints before save. */
export const SHIPPING_PLATFORMS = [
  { id: "delhivery", label: "Delhivery", trackingUrlTemplate: "https://www.delhivery.com/track/package/{awb}" },
  { id: "bluedart", label: "Blue Dart", trackingUrlTemplate: "https://www.bluedart.com/web/guest/trackdartresult?trackNo={awb}" },
  { id: "dtdc", label: "DTDC", trackingUrlTemplate: "https://www.dtdc.in/tracking.asp?strCnno={awb}" },
  { id: "indiapost", label: "India Post", trackingUrlTemplate: "https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?consignment={awb}" },
  { id: "ekart", label: "Ekart / Flipkart Logistics", trackingUrlTemplate: "" },
  { id: "other", label: "Other (custom link)", trackingUrlTemplate: "" },
];

export function buildTrackingUrl(platformId, awb, customUrl = "") {
  const trimmed = String(customUrl || "").trim();
  if (trimmed) return trimmed;
  const platform = SHIPPING_PLATFORMS.find((p) => p.id === platformId);
  const id = String(awb || "").trim();
  if (!platform?.trackingUrlTemplate || !id) return "";
  return platform.trackingUrlTemplate.replace(/\{awb\}/gi, encodeURIComponent(id));
}
