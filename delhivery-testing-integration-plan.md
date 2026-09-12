# Delhivery API — Test-Mode Integration Plan (for LyZov)

**Purpose of this document:** A step-by-step, AI-agent-followable plan for integrating Delhivery's shipping APIs into LyZov in **test/staging mode only**. Any AI coding tool (Claude Code, Cursor, Copilot, etc.) can follow this document phase-by-phase to build the integration without needing further research.

**Sources (official, verified):**
- https://delhivery-express-api-doc.readme.io/ (Delhivery Express API documentation)
- https://help.delhivery.com/docs/client-developer-portal-1 (Client Developer Portal)

Anything not confirmed by these sources is explicitly marked **[UNVERIFIED]** below.

---

## 0. Ground Truth: How Delhivery's Test Mode Actually Works

| Fact | Detail |
|---|---|
| Test environment exists? | ✅ Yes — genuine separate staging infrastructure |
| Staging base URL | `https://staging-express.delhivery.com` |
| Production base URL | `https://track.delhivery.com` |
| Credentials | **Two separate API tokens** — a staging/test token issued first, and a separate production token issued only after UAT sign-off. Both come from your Delhivery Business Development / Client Success manager, not a self-serve dashboard signup. |
| Client account info needed | Client name (HQ name), User ID, API Token, Pickup warehouse location name — all provided by Delhivery's account manager |
| Important caveat | The **Invoice/Shipping Charge API only returns accurate, contract-based rates on the production URL** (`track.delhivery.com`). Staging rate responses should not be trusted for real pricing decisions — treat staging purely as a functional/logic test, not a cost simulator. **[Per Delhivery's own docs]** |

**Action for LyZov before writing any code:** Someone on the team needs to contact Delhivery's sales/BD team to get:
1. A staging API token
2. A registered pickup warehouse name (needed before any order can be created)
3. Confirmation of contracted rates (for later production cutover)

This is a manual business step — no AI tool can complete it. Everything below assumes this token exists.

---

## 0.1 How to Actually Obtain a Token — Two Distinct Paths

Delhivery operates two separate product tracks, and they get you two different kinds of tokens. This distinction matters — don't conflate them.

### Path A — Delhivery One (self-serve, available today)

This is Delhivery's SME self-service platform. No sales conversation required.

1. Go to **Delhivery One** and sign up with Name, Email ID, Phone Number, Password
2. Click **"Activate your business account"**
3. Provide either:
   - **GST Number** + GST document, **or**
   - If no GST yet: **PAN + Aadhaar** details
4. Once activated: **Main Menu → Settings → API Setup**
5. Your **API Token** is displayed there — copy it immediately (revealed only once), or click **"Request Live API Token"** to rotate it

⚠️ **Honesty check:** This is **not** a true isolated sandbox. It's a real Delhivery One account token, hitting real infrastructure. It's safe to use for testing only in the same sense the Shiprocket "dedicated dev account" was safe — because it's a fresh, low-stakes, disposable account you fully control, not because Delhivery has isolated it from reality. Any order created will be a real order in that account.

**This is the fastest way for LyZov to get a working token today**, and is the recommended starting point given the phased plan in Section 3.

### Path B — Delhivery Express/Enterprise API (true staging, sales-managed)

This is the track referenced throughout Sections 1–2 of this document (`staging-express.delhivery.com`, dual staging/production tokens, UAT sign-off process). This credential pair is **not self-serve** — per Delhivery's own integration prerequisites, it's issued by a **Delhivery sales representative / Business Development–Client Success manager** once LyZov is set up as a client on this track.

**No public "request a sandbox key" form was found** for this tier in official documentation — every verified source points to a human relationship (sales rep contact), not a self-service URL. If LyZov expects meaningful order volume, this is the track worth pursuing in parallel with Path A, since it provides genuinely isolated staging infrastructure and a formal UAT process before production cutover.

### Recommended sequencing for LyZov

| Step | Action |
|---|---|
| 1 (today) | Sign up for Delhivery One (Path A), generate a token, start building against Phases 1–3 of the plan below using dummy/low-value test orders |
| 2 (in parallel) | Contact Delhivery sales to inquire about the Express/Enterprise API track (Path B) if LyZov anticipates meaningful volume — ask specifically for "sandbox/staging API credentials for evaluation," and request the registered pickup warehouse name and Client Name/User ID alongside it |
| 3 (later) | If/when Path B credentials arrive, re-point the `DelhiveryClient` at `staging-express.delhivery.com` for a more rigorous pre-production UAT pass, then cut over to production only after formal sign-off |

---

## 1. Environment & Config Setup (Phase 0)

Create environment variables — never hardcode tokens:

```env
DELHIVERY_ENV=staging                 # staging | production
DELHIVERY_BASE_URL=https://staging-express.delhivery.com
DELHIVERY_API_TOKEN=xxxxxxxxxxxxxxxx  # staging token from Delhivery BD manager
DELHIVERY_PICKUP_LOCATION=YourWarehouseName   # must exactly match registered warehouse name (case-sensitive)
DELHIVERY_CLIENT_NAME=YourClientName          # HQ name registered with Delhivery
```

**Auth header format (all APIs):**
```
Authorization: Token xxxxxxxxxxxxxxxx
Content-Type: application/json
```

Build a single `DelhiveryClient` class/service in the PHP backend that:
- Reads `DELHIVERY_BASE_URL` from config so switching staging→production later is a one-line env change, never a code change
- Centralizes the auth header
- Logs every request/response (sanitized of token) for debugging during testing

---

## 2. API-by-API Reference (What to Build, In Order)

### 2.1 Pincode Serviceability API — build first, read-only, zero risk

| | |
|---|---|
| Method | `GET` |
| Staging URL | `https://staging-express.delhivery.com/c/api/pin-codes/json/?filter_codes={pincode}` |
| Production URL | `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes={pincode}` |
| Auth | `Authorization: Token <token>` header |
| Purpose | Confirms whether a pincode is serviceable, and whether COD/Prepaid/Reverse pickup is supported there |
| Response includes | Serviceability flags per pincode, an `"NSZ"` (non-serviceable zone) marker |

**LyZov use case:** Call this at checkout when the customer enters their pincode, before showing shipping options — this is the safest possible first integration point.

---

### 2.2 Bulk / Fetch Waybill API — get AWB numbers in advance

| | |
|---|---|
| Purpose | Pre-generates waybill (AWB) numbers you can store and use later in Order Creation, instead of letting Delhivery auto-assign one at order time |
| Two variants | **Bulk Waybill API** (fetch many at once, cache them) and **Fetch Waybill API** (fetch one at a time) |
| Note | Optional — order creation can also auto-assign a waybill if you don't pass one for single-piece shipments |

**LyZov use case:** For Multi-Piece Shipments (MPS) — orders split into multiple boxes — a waybill **must** be explicitly assigned per box. For single-box orders, you can skip this and let Delhivery auto-assign.

---

### 2.3 Client Warehouse Creation / Update API

| | |
|---|---|
| Purpose | Registers a pickup location ("warehouse") with Delhivery. **Order creation only works against a warehouse name that already exists in Delhivery's system.** |
| Note | Optional to integrate — your business team can also email `Vendordesk@delhivery.com` to get a warehouse created manually (one-time). Only build this API if LyZov needs to dynamically onboard vendor pickup addresses without manual back-and-forth. |
| Constraint | Payload only accepts the exact documented fields — no arbitrary extra keys allowed |

**LyZov-specific consideration:** Since LyZov is **multi-vendor**, each vendor's pickup address is logically a separate Delhivery "warehouse." Decide early: does every vendor get their own registered Delhivery warehouse, or does LyZov consolidate shipping through a single central warehouse? (See Section 4 — architecture recommendation.)

---

### 2.4 Order Creation / Manifestation API — the core "create shipment" call

| | |
|---|---|
| Method | `POST` |
| Staging URL | `https://staging-express.delhivery.com/api/cmu/create.json` |
| Production URL | `https://track.delhivery.com/api/cmu/create.json` |
| Payload format | Must literally include `format=json&data=<url-encoded-JSON>` in the POST body — this is a Delhivery-specific quirk, not a standard JSON POST |
| Mandatory fields | `pin`, `phone`, `address` (consignee), `payment_mode` (`COD` / `Prepaid` for forward shipments, `Pickup` for reverse/RTO), pickup location name (must exactly match a registered warehouse, case-sensitive), `seller_gst_tin`, `hsn_code` (product HSN code — mandatory per GST rules) |
| Order ID rule | Must be unique per order **unless** you also pass your own waybill — then order+waybill together form the unique key |
| Special cases | `fragile_shipment: true/false` for fragile items; e-waybill required if shipment value > ₹50,000; special characters `& # % ; \` are not allowed in the payload unless properly JSON-escaped |
| Shipment types | Single Piece Shipment (one waybill, can hold multiple SKUs) vs Multi Piece Shipment (each box needs its own waybill) |
| Reverse/RTO variant | Same endpoint, same payload shape — just set `payment_mode: "Pickup"` instead of COD/Prepaid |

**Test plan for this endpoint:**
1. Create ONE test order in staging using your own name/phone/address as the consignee
2. Use a low-value dummy product with a placeholder HSN code
3. Confirm the response returns a waybill number
4. Verify `format=json&data=` encoding is correct — this is the #1 integration mistake reported in Delhivery forums/support threads

---

### 2.5 Edit Order API — modify a shipment after manifestation

| | |
|---|---|
| Method | `POST` |
| Purpose | Corrects/updates order details after creation (e.g., wrong address caught before pickup) |
| Note | Advanced/optional integration — same correction can be done manually via the CL Panel |

---

### 2.6 Cancel Order API — your test cleanup mechanism

| | |
|---|---|
| Method | `POST` |
| Staging URL | `https://staging-express.delhivery.com/api/p/edit` |
| Production URL | `https://track.delhivery.com/api/p/edit` |
| Key field | `"cancellation": "true"` in the payload, referencing the waybill |
| Allowed statuses to cancel from | Manifested, In Transit, Pending, Open, Scheduled |
| Effect | Prepaid/COD orders → status becomes "Returned"; Pickup (reverse) orders → status becomes "Cancelled" |

**This is your safety valve** — every test order created in Section 2.4 should be cancelled via this endpoint immediately after your test assertions pass, so staging data doesn't pile up.

---

### 2.7 Pickup Request Creation API — the "real world trigger" equivalent

| | |
|---|---|
| Method | `POST` |
| Staging URL | `https://staging-express.delhivery.com/fm/request/new/` |
| Production URL | `https://track.delhivery.com/fm/request/new/` |
| Required inputs | Pickup date, pickup time, warehouse name, quantity |
| Response | Returns a `pickup_id` |
| Constraint | Only one active pickup request per warehouse at a time — a second request for the same warehouse can only be made after the first is completed. Multiple warehouses can have simultaneous pickup requests. |
| Note | Optional — pickup requests can also be raised manually via the CL Panel |

**Since this is running in staging**, it should be safe to call without triggering a real-world courier dispatch — but this is the conceptual equivalent of Shiprocket's "Generate Pickup" call. **[UNVERIFIED]:** whether Delhivery's staging pickup-request endpoint fully no-ops with zero physical-world side effects, or whether it's purely a logic/response simulation — this specific behavioral detail was not explicitly stated in the docs retrieved. Confirm with your Delhivery account manager before relying on this assumption for automated test suites.

---

### 2.8 Order Tracking API

| | |
|---|---|
| Method | `GET` (Pull) or `POST` webhook (Push) |
| Staging URL (Pull) | `https://staging-express.delhivery.com/api/v1/packages/json/?waybill={waybill}` |
| Production URL (Pull) | `https://track.delhivery.com/api/v1/packages/json/?waybill={waybill}` |
| Rate limit | 750 requests per 5 minutes per IP on the Pull API |
| Push (webhook) alternative | You provide an open endpoint URL; Delhivery pushes every scan event to it in a default format as it happens — avoids polling entirely |

**Recommendation for LyZov:** Build the Pull (GET) integration first since it's simpler to test deterministically. Add the Push webhook receiver once the core order lifecycle logic is proven, since webhook testing requires a publicly reachable staging URL (e.g., via ngrok during local dev).

---

### 2.9 Packing Slip / Label Generation API

| | |
|---|---|
| Purpose | Generates the printable shipping label/packing slip PDF for a given waybill |
| Note | Optional to integrate — the same label can be fetched manually from the CL Panel. Only needed if LyZov wants labels auto-generated in-app for vendors to print. |

---

### 2.10 Invoice / Shipping Charge (Rate Calculation) API

| Params (from official docs) | Mandatory | Type | Notes |
|---|---|---|---|
| `md` | M | String | Billing mode: `E` (Express) or `S` (Surface) |
| `cgm` | M | Integer | Chargeable weight, in **grams** |
| `o_pin` | M | Integer | Origin pincode |
| `d_pin` | M | Integer | Destination pincode |
| `ss` | M | String | Shipment status: `Delivered`, `RTO`, or `DTO` |

⚠️ **Rate limit:** 40 requests/minute per IP — throttled for 1 minute if exceeded.
⚠️ **Critical caveat directly from Delhivery's docs:** this API gives an *approximate* value only; the actual amount charged can differ. And it explicitly states to **use the production URL (`track.delhivery.com`) to get updated/accurate rates** — meaning staging rate-check responses may not be reliable even for logic testing of "does my rate estimate roughly match" scenarios.

---

### 2.11 NDR (Non-Delivery Report) Action API — for failed delivery attempts

| | |
|---|---|
| Purpose | Lets you take action on a package that had a failed delivery attempt: reschedule ("Deferred Delivery Date"), edit consignee details, or "Reattempt per NDR instructions" |
| Behavior | Asynchronous — every call returns a UPL (Update Package List) ID immediately; use the companion "Get NDR status" API to poll for the actual outcome |
| Date format | `YYYY-MM-DD` for deferred delivery date |

---

### 2.12 Reverse Pickup / RTO

Confirmed: **there is no separate endpoint** — reverse pickup uses the same Order Creation API (2.4) with `payment_mode: "Pickup"`. If you omit "return" fields, the shipment routes to the registered warehouse address by default; if you include return-specific fields, it routes to a specified return address instead.

---

## 3. Recommended Build Order (Phased Plan for the AI Tool to Follow)

| Phase | What to build | Why this order |
|---|---|---|
| **Phase 1** | `DelhiveryClient` base service (auth, base URL config, logging) | Everything else depends on this |
| **Phase 2** | Pincode Serviceability integration at checkout | Read-only, zero risk, immediate customer-facing value |
| **Phase 3** | Rate/Invoice estimate integration at checkout | Still read-only — but remember the "staging rates are unreliable" caveat; consider gating actual customer-facing price display behind production credentials only, and using a flat/estimated rate table in dev |
| **Phase 4** | Order Creation (staging only) — behind a feature flag / admin-only test button, NOT wired to real checkout yet | This is where "test mode" really begins — validate payload structure without customer impact |
| **Phase 5** | Cancel Order — build this in the SAME PR as Phase 4 | Every test order created needs an immediate cleanup path |
| **Phase 6** | Order Tracking (Pull/GET) | Read-only, validates the waybill from Phase 4 actually exists in Delhivery's system |
| **Phase 7** | Pickup Request Creation | Only after Phases 4–6 are solid; treat as the "point of no easy return" the same way Shiprocket's Generate Pickup was flagged earlier |
| **Phase 8** | Webhook (Push tracking) receiver | Needs a public staging URL — build after core polling flow works |
| **Phase 9** | NDR handling | Only relevant once real order volume exists to generate NDR events |
| **Phase 10** | Client Warehouse Creation API (only if LyZov needs per-vendor dynamic warehouses — see Section 4) | Architectural decision gates whether this is even needed |

**Testing discipline at every phase:**
- Prefix every test order/consignee name with `LYZOV-TEST-*`
- Use your own phone/address as the test consignee
- Immediately cancel test orders after assertions pass (Phase 5 exists specifically for this)
- Never point Phase 4+ at the production URL until formal UAT sign-off with Delhivery is complete

---

## 4. Multi-Vendor Architecture Recommendation

Since LyZov is multi-vendor, the central open question is: **how does "pickup location" map to "vendor" in Delhivery's model?**

### Option A — One Delhivery warehouse per vendor
- Each vendor's registered address = a separate Delhivery "Client Warehouse"
- Order creation passes that vendor's exact warehouse name as `pickup_location`
- **Pros:** Cleanest 1:1 mapping, accurate per-vendor pickup scheduling, per-vendor pickup requests
- **Cons:** Every new vendor onboarding requires a warehouse registration step (via API — Section 2.3 — or manual email to Delhivery); more warehouses to manage in Delhivery's system

### Option B — Single centralized warehouse (LyZov's own hub)
- All vendor shipments physically flow through one LyZov-operated hub before dispatch
- Only one Delhivery warehouse registered, ever
- **Pros:** Simplest Delhivery-side integration, only one pickup request needed per day
- **Cons:** Requires LyZov to physically consolidate goods from vendors first — an operational/logistics decision, not just a technical one; doesn't scale if vendors ship independently from their own locations

**Given LyZov is described as multi-vendor with (presumably) vendors shipping independently**, Option A is very likely the better fit *if* vendors dispatch from their own premises — but this is ultimately a business/ops decision the LyZov team needs to confirm, not something to infer purely from the API docs.

### Recommended database changes **[design-level, not yet informed by actual schema — codebase inspection still pending]**

Suggested new/extended tables:

```
delhivery_credentials
  - id
  - environment (staging|production)
  - api_token (encrypted)
  - client_name
  - created_at / updated_at

vendor_warehouses
  - id
  - vendor_id (FK -> vendors)
  - delhivery_warehouse_name   (must exactly match registered name)
  - address fields (line1, line2, city, state, pincode, phone)
  - is_delhivery_registered (bool)
  - registered_at

shipments
  - id
  - order_id (FK -> orders)
  - vendor_id (FK -> vendors)
  - waybill_number
  - courier = 'delhivery'
  - payment_mode (COD | Prepaid | Pickup)
  - status (Manifested | In Transit | Delivered | RTO | Cancelled | ...)
  - pickup_request_id (nullable)
  - label_url (nullable)
  - is_test (bool)   -- flags staging-created shipments distinctly from production ones
  - created_at / updated_at

shipment_tracking_events
  - id
  - shipment_id (FK -> shipments)
  - status
  - scan_location
  - scan_datetime
  - raw_payload (JSON, for webhook debugging)

ndr_actions
  - id
  - shipment_id (FK -> shipments)
  - action_type (deferred_delivery | edit_details | reattempt)
  - upl_id (Delhivery's async tracking ID)
  - status
  - created_at
```

**Note:** These table designs are proposals based on Delhivery's API shape alone. Once the actual LyZov codebase is available for inspection (orders, vendors, checkout, payments, shipping tables), this section should be revisited to align naming conventions and avoid duplicating existing structures — **flagging this as the pending, not-yet-completed part of the original research request.**

---

## 5. Summary Checklist for the AI Tool

- [ ] Confirm staging API token + registered warehouse name obtained from Delhivery BD manager (manual, non-code step)
- [ ] Build `DelhiveryClient` with env-driven base URL
- [ ] Implement Pincode Serviceability (read-only)
- [ ] Implement Rate/Invoice estimate (read-only, flag staging-rate unreliability)
- [ ] Implement Order Creation behind admin-only test flag
- [ ] Implement Cancel Order in the same phase as Order Creation
- [ ] Implement Order Tracking (Pull)
- [ ] Implement Pickup Request Creation (last, deliberately)
- [ ] Implement Webhook receiver for Push tracking
- [ ] Implement NDR action handling
- [ ] Decide Option A vs Option B multi-vendor warehouse architecture with the LyZov team (business decision, not purely technical)
- [ ] Revisit proposed DB schema once real codebase is inspected
- [ ] Only after full staging UAT sign-off with Delhivery: switch `DELHIVERY_ENV` to `production` and swap tokens

---

## 6. Explicitly Unverified Items

| Item | Why unverified |
|---|---|
| Whether Delhivery's staging Pickup Request API has zero real-world physical effect | Not explicitly stated in the retrieved docs — confirm with Delhivery account manager |
| Exact SLA/turnaround for staging (Path B) token issuance | Not stated in public docs — this is relationship-managed, ask your BD contact |
| Whether Client Warehouse Creation API is available in staging (vs. production-only) | Not explicitly confirmed either way in the sections retrieved |
| Whether a Delhivery One (Path A) token can call the Express API endpoints documented in Section 2, or only a separate "One Panel" API set | The self-serve Delhivery One portal and the Express/Enterprise API docs appear to be two related but distinct product tracks; exact overlap in endpoint compatibility was not confirmed in the sources retrieved — verify directly once a Delhivery One token is in hand by testing against Section 2.1 (Pincode Serviceability) first |
| LyZov's actual current orders/vendors/checkout schema | Codebase was not available in this session — recommend re-running this research once the repo is uploaded |
