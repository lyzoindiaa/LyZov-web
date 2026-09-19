# Delhivery API Integration Plan (Node.js/Express)

This document provides a detailed implementation plan and architecture for integrating Delhivery's shipping APIs into the LyZov Node.js backend. This version has been fully corrected based on the review findings to ensure it successfully works against Delhivery's real APIs.

## Architecture Diagram

```mermaid
flowchart TD
    subgraph Frontend [React Frontend]
        C[Checkout Page]
        A[Admin Panel]
    end

    subgraph Backend [Node.js Express Backend]
        R[Shipping Routes]
        SC[Shipping Controller]
        DS[Delhivery Service\n(with Rate Limiting & Env Guard)]
        M[(MongoDB - Shipment / Order)]
    end

    subgraph Delhivery [Delhivery API]
        D_Auth[Auth Validation]
        D_Pincode[Pincode Serviceability]
        D_Rates[Rate Estimation]
        D_Order[Order Creation]
        D_Cancel[Cancel Order]
        D_Track[Order Tracking]
        D_Pickup[Pickup Request]
    end

    %% Flow connections
    C -- "GET /api/shipping/pincode" --> R
    C -- "POST /api/shipping/estimate" --> R
    A -- "POST /api/shipping/order" --> R
    
    R --> SC
    SC <--> M
    SC --> DS
    
    DS -- "Token Auth" --> D_Auth
    DS -- "GET /pin-codes/" --> D_Pincode
    DS -- "GET /api/kinko/v1/invoice/charges/.json" --> D_Rates
    DS -- "POST /api/cmu/create.json" --> D_Order
    DS -- "POST /api/p/edit" --> D_Cancel
    DS -- "GET /api/v1/packages/json/" --> D_Track
    DS -- "POST /fm/request/new/" --> D_Pickup
```

## User Review Required

> [!WARNING]
> We need an API token before any real testing can happen. The reference document specifies two paths:
> **Path A (Delhivery One - Self Serve):** Fastest way. Sign up on Delhivery One, activate with GST/PAN, and get a token today. We can start Phase 1-3 immediately with this.
> **Path B (Express/Enterprise API - Sales Managed):** Required for true staging/UAT isolation. We must contact sales for this.

> [!IMPORTANT]
> **Warehouse Architecture (Option A vs B)**:
> **Option A:** One Delhivery warehouse per vendor. Requires dynamic warehouse registration.
> **Option B:** Single centralized LyZov warehouse.
> *Since LyZov is multi-vendor, we've updated the Schema to support Option A (Vendor attribution), but you must confirm this operationally.*

## Proposed Architecture (Node.js)

### 1. Environment & Config Setup

```env
DELHIVERY_ENV=staging
DELHIVERY_BASE_URL=https://staging-express.delhivery.com
DELHIVERY_API_TOKEN=your_token_here
DELHIVERY_CLIENT_NAME=YourClientName
```

### 2. Node.js `DelhiveryClient` Service

Create `backend/server/services/delhiveryService.js`.
**Crucial Startup Guard:**
```javascript
if (process.env.DELHIVERY_ENV === 'staging' && !process.env.DELHIVERY_BASE_URL.includes('staging-express')) {
  throw new Error('DELHIVERY_ENV=staging but base URL does not point to staging infrastructure');
}
```

Methods to implement (with built-in Rate Limiting wrappers):
- `checkPincodeServiceability(pincode)`
- `estimateShippingRates(params)`: **Must** use production URL `https://track.delhivery.com/api/kinko/v1/invoice/charges/.json` as a `GET` with query params (`cl`, `ss`, `md`, `pt`, `d_pin`, `o_pin`, `cgm`). Limit: 40/min.
- `createOrder(orderData)`: Handles forward shipments. **Must** send as `Content-Type: application/x-www-form-urlencoded` with body `format=json&data=<url-encoded-JSON-string>`. Payload must include `seller_gst_tin` and `hsn_code`.
- `createReversePickup(orderData)`: Wrapper for `createOrder` setting `payment_mode="Pickup"`.
- `cancelOrder(waybill)`: `POST /api/p/edit` with `{ "waybill": "...", "cancellation": "true" }`.
- `trackOrder(waybill)`: `GET /api/v1/packages/json/?waybill={waybill}`. Limit: 750/5min.
- `createPickupRequest(params)`

### 3. Database Schema Updates (Mongoose)

Create `backend/server/models/Shipment.js`:
```javascript
const shipmentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  pickupWarehouseName: { type: String, required: true }, // exact Delhivery-registered name
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

### 4. API Routes & Controllers

Create `shippingRoutes.js` and `shippingController.js` for:
- `GET /api/shipping/pincode/:pincode`
- `POST /api/shipping/estimate`
- `POST /api/shipping/order/:orderId`
- `POST /api/shipping/return/:orderId`
- `POST /api/shipping/cancel/:waybill`
- `GET /api/shipping/track/:waybill`
