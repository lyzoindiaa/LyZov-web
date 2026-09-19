# Delhivery Node.js Implementation Plan — Review Findings

**Reviewed file:** `DELHIVERY_NODEJS_IMPLEMENTATION_PLAN.md`
**Stack confirmed:** Node.js / Express / MongoDB (Mongoose)
**Sources used to verify:** Delhivery Express API official docs (https://delhivery-express-api-doc.readme.io/), Delhivery Client Developer Portal docs (https://help.delhivery.com/docs/client-developer-portal-1)

This document lists everything that is **missing, incomplete, or incorrect** in the reviewed plan, with the corrected detail for each. Nothing here is a new feature request — it's what's needed to make the existing plan actually work against Delhivery's real APIs.

---

## 1. Wrong endpoint — Rate / Invoice API

| | |
|---|---|
| **In the plan** | `GET /invoice/charges/` |
| **Correct (official)** | `GET https://track.delhivery.com/api/kinko/v1/invoice/charges/.json?cl={client_name}&ss={shipment_status}&md={mode}&pt={payment_type}&d_pin={dest_pincode}&o_pin={origin_pincode}&cgm={weight_in_grams}` |
| **Fix needed** | `estimateShippingRates()` must build this exact query string — it's a `GET` with 7 query params, not a clean REST path |
| **Extra note** | Use the **production** URL for this specific call even while everything else runs on staging. Delhivery's own docs state staging rate responses are not reliable estimates — this one read-only call is safe to point at production regardless of environment. |

---

## 2. Missing payload format for Order Creation — will break on first real call

| | |
|---|---|
| **In the plan** | Implies a normal JSON POST body |
| **Correct (official)** | `POST /api/cmu/create.json` requires `Content-Type: application/x-www-form-urlencoded` with body `format=json&data=<url-encoded-JSON-string>` |
| **Fix needed** | `createOrder()` must build the JSON payload object, `encodeURIComponent()` it, then send as the `data` form field — not `axios.post(url, jsonPayload)` as currently implied |
| **Why this matters** | This is the single most common Delhivery integration failure reported in forums/support threads — every order creation call will fail silently or with a confusing error until this is fixed |

---

## 3. Missing mandatory fields in the Order Creation payload

Add to the `createOrder()` payload builder and to the underlying Order/DTO model:

| Field | Requirement |
|---|---|
| `seller_gst_tin` | **Mandatory** — GST TIN of the seller |
| `hsn_code` | **Mandatory** per product — Harmonized System of Nomenclature code |
| `fragile_shipment` | Optional, `true`/`false` at payload root — **only include the key when applicable; omit entirely if not fragile** (do not pass `false` explicitly per Delhivery's guidance) |
| E-waybill reference | Mandatory only if total shipment value exceeds ₹50,000 (government requirement) |

---

## 4. Cancel Order endpoint — never actually specified

`cancelOrder(waybill)` is listed as a service method name in the plan, but no endpoint is given anywhere in the document.

| | |
|---|---|
| **Correct (official)** | `POST https://staging-express.delhivery.com/api/p/edit` (production: `https://track.delhivery.com/api/p/edit`) |
| **Body** | `{ "waybill": "...", "cancellation": "true" }` |
| **Allowed only from these statuses** | `Manifested`, `In Transit`, `Pending`, `Open`, `Scheduled` |
| **Effect** | Prepaid/COD shipments → status becomes `Returned`; Pickup (reverse) shipments → status becomes `Cancelled` |

The architecture diagram currently draws "Order Creation / Cancel" as a single arrow to one endpoint — this is incorrect; they are two distinct URLs and must be modeled as two distinct calls in `delhiveryService.js`.

---

## 5. Tracking endpoint missing its required query parameter

| | |
|---|---|
| **In the plan** | `GET /api/v1/packages/` |
| **Correct (official)** | `GET /api/v1/packages/json/?waybill={waybill}` |
| **Fix needed** | `trackOrder(waybill)` must append the waybill as a query param — the bare path alone will not return anything usable |

---

## 6. Shipment schema missing `vendor` — contradicts the plan's own multi-vendor goal

The plan explicitly flags the Option A (per-vendor warehouse) vs. Option B (centralized warehouse) decision as needing review — correctly deferred. But the proposed `Shipment` schema has no `vendor` field at all, only `order`. This makes it impossible to attribute a shipment to a vendor under either option, undermining the reason this integration is being built for a multi-vendor app.

**Corrected schema:**

```javascript
const shipmentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  pickupWarehouseName: { type: String, required: true }, // exact Delhivery-registered name, case-sensitive
  waybillNumber: { type: String, required: true, unique: true },
  paymentMode: { type: String, enum: ['Prepaid', 'COD', 'Pickup'] },
  status: {
    type: String,
    enum: ['Manifested', 'In Transit', 'Pending', 'Open', 'Scheduled', 'Delivered', 'RTO', 'Returned', 'Cancelled'],
    default: 'Manifested'
  },
  pickupRequestId: { type: String },
  labelUrl: { type: String },
  isTest: { type: Boolean, default: true },
  courier: { type: String, default: 'delhivery' }
}, { timestamps: true });
```

Changes from the original: added `vendor` (required), added `pickupWarehouseName` (required), and replaced the vague free-text `status` default with Delhivery's actual status vocabulary so cancel-eligibility checks (Section 4 above) can be enforced in code.

---

## 7. Missing hard dependency: warehouse must exist before Order Creation will work

Order Creation will reject any `pickup_location` value that isn't already a warehouse registered in Delhivery's system — and the name match is exact and case-sensitive.

**Missing from the plan:** an explicit prerequisite phase covering this. Add a **Phase 0.5** before Order Creation testing begins:
- Either call the **Client Warehouse Creation API** once per vendor (if Option A is chosen), or
- Confirm each pickup address was registered manually via `Vendordesk@delhivery.com` (one-time, per warehouse)

No order creation call can be meaningfully tested until this exists for at least one test warehouse.

---

## 8. Rate limits — not handled anywhere in the plan

| Endpoint | Limit |
|---|---|
| Tracking (Pull/GET) | 750 requests / 5 minutes / IP |
| Invoice/Rate estimate | 40 requests / minute / IP — IP gets throttled for 1 minute if exceeded |

**Fix needed:** add a basic rate-limiter or request queue wrapper inside `delhiveryService.js`, rather than discovering these limits via production failures later.

---

## 9. No environment-safety guard

Nothing in the plan prevents `DELHIVERY_ENV=staging` from silently pointing at a production URL (or vice versa) due to a misconfigured `.env`.

**Fix needed:** add a startup assertion in the `DelhiveryClient`/service constructor, e.g.:
```javascript
if (process.env.DELHIVERY_ENV === 'staging' && !process.env.DELHIVERY_BASE_URL.includes('staging-express')) {
  throw new Error('DELHIVERY_ENV=staging but base URL does not point to staging infrastructure');
}
```

---

## Summary Table

| # | Issue | Severity |
|---|---|---|
| 1 | Wrong Invoice/Rate endpoint path | High — call will fail as written |
| 2 | Missing `format=json&data=` payload wrapping for Order Creation | Critical — order creation will fail on first call |
| 3 | Missing mandatory `seller_gst_tin` / `hsn_code` fields | High — Delhivery will reject the order |
| 4 | Cancel Order endpoint never specified | High — method exists in name only |
| 5 | Tracking endpoint missing `?waybill=` param | High — call returns nothing usable |
| 6 | Shipment schema missing `vendor` field | High — breaks multi-vendor attribution |
| 7 | No prerequisite phase for warehouse registration | Medium — blocks all order-creation testing |
| 8 | No rate-limit handling | Medium — will surface as confusing failures under load |
| 9 | No env-safety guard against staging/production mix-up | Medium — risk of accidental real-world side effects |

Once items 1–6 are corrected, the plan is safe to hand back to the implementation AI tool. Items 7–9 should be added as explicit tasks/phases rather than left implicit.
