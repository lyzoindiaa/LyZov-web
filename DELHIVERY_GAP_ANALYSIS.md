# Delhivery Shipping & Order Lifecycle: Gap Analysis & Roadmap

This document outlines the remaining missing components across the backend and frontend needed to make the LyZov + Delhivery shipping, cancel, return, and exchange integration 100% production-ready.

---

## 1. Executive Summary of Missing Components

| Component | Area | Missing Item | Priority | Status |
|---|---|---|---|---|
| **Backend** | Shipping Controller | Smart Auto-Manifestation: `POST /api/shipping/order/:orderId` should auto-construct payload from DB `Order` document rather than requiring raw manual JSON | **High** | **Completed** |
| **Backend** | Shipping Service | Packing Slip / Shipping Label Generation (`GET /api/shipping/label/:waybill`) | **High** | **Completed** |
| **Backend** | Shipping Controller | Pickup Dispatch Request endpoint (`POST /api/shipping/pickup-request`) | Medium | **Completed** |
| **Backend** | Shipping Routes | Protect shipping routes with `protect` and `authorize('seller', 'admin')` | **High** | **Completed** |
| **Admin UI** | Orders Table | Fix `require('axios')` bug on `AdminOrdersPage.jsx:L123` & wire clean manifestation hook | **High** | **Completed** |
| **Admin UI** | Order Details | "Ship via Delhivery" button on `AdminOrderDetailsPage.jsx` | **High** | **Completed** |
| **Admin UI** | Order Details | "Approve Return" & "Process Exchange" buttons for return requests | **High** | **Completed** |
| **Admin UI** | Order Details | Display Waybill AWB, Delhivery status badge & "Print Shipping Label" action | Medium | **Completed** |
| **Customer UI**| Order Details | "Request Return / Exchange" button on `OrderDetailsPage.jsx` (active when delivered within 7 days) | **High** | **Completed** |
| **Customer UI**| Order Details | Modal to select Refund vs Exchange, select return reason, and submit request | **High** | **Completed** |
| **Customer UI**| Order Details | Delhivery tracking progress timeline & AWB display | Medium | **Completed** |
| **Product UI** | Product Page | Pincode delivery serviceability check widget on `ProductDetailsPage.jsx` | Medium | **Completed** |
| **Config** | Environment | Provide live/test credentials in `.env` (`DELHIVERY_API_TOKEN`, `DELHIVERY_PICKUP_LOCATION`) | External | **Pending User Credentials** |

---

## 2. Detailed Technical Breakdown

### A. Backend Shipping Automation
1. **Smart Order Manifestation (`shippingController.createOrder`)**:
   - Currently, `POST /api/shipping/order/:orderId` expects the caller to manually supply raw Delhivery JSON in `req.body`.
   - **Resolution**: Query `Order.findById(orderId)`. Automatically populate consignee address, pincode, phone, products description, and total amount. Compute COD vs Prepaid based on `order.paymentMethod`. Save `Shipment` document, set `order.trackingNumber = waybill`, update `order.orderStatus = "processing"`, and push to `statusHistory`.
2. **Shipping Label / Packing Slip**:
   - Delhivery endpoint: `GET /api/p/packing_slip?wbns={waybill}&pdf=true`.
   - Add `getPackingSlip(waybill)` to `delhiveryService.js`.
   - Expose endpoint `GET /api/shipping/label/:waybill` in `shippingRoutes.js`.
3. **Pickup Dispatch Request**:
   - Expose `POST /api/shipping/pickup-request` calling `delhiveryService.createPickupRequest()`.
4. **Route Security**:
   - Apply `protect` and `authorize('seller', 'admin')` to manifest, return approval, label, and pickup routes in `shippingRoutes.js`.

### B. Admin Dashboard Enhancements
1. **Fix Vite ESM Runtime Bug**:
   - In `AdminOrdersPage.jsx`, replace `const axios = require('axios')` with `shippingService.manifestOrder(orderId)`.
2. **Return & Exchange Management**:
   - In `AdminOrderDetailsPage.jsx`, if `order.returnStatus === 'Requested'`:
     - Display Return Banner with customer's reason and exchange preferences.
     - Add **"Approve Return (Schedule Delhivery Pickup)"** button.
   - If `order.returnStatus === 'Approved'` or `'Returned'` and `order.isExchange === true`:
     - Add **"Process Exchange (Generate Replacement Order)"** button.
3. **Delhivery Shipment Card**:
   - Display AWB Number with a live link to track.
   - Display "Print Shipping Label" button.

### C. Customer Dashboard Enhancements
1. **Return & Exchange Workflow**:
   - In `OrderDetailsPage.jsx`, when `order.orderStatus === 'delivered'`:
     - Check if delivery is within 7 days.
     - Render **"Request Return / Exchange"** button.
     - Open interactive modal:
       - Mode: "Refund to Payment Method" or "Exchange for Size/Item".
       - Dropdown for return reason (Size Too Small, Size Too Large, Defective/Damaged, Wrong Item Received, Quality Not As Expected).
       - Textarea for specific notes / variant request.
   - If `order.returnStatus` is active (`Requested`, `Approved`, `Picked Up`, etc.), show dedicated status card.
2. **Live Tracking Widget**:
   - If `order.trackingNumber` is present, display Delhivery tracking progress.

### D. Product Details Page (Pincode Check)
1. **Delivery Estimator**:
   - Add a "Check Delivery to Pincode" input on `ProductDetailsPage.jsx` calling `checkPincode(pincode)` from `shippingService.js`.
   - Display serviceability badge (e.g. "Delivery available in 3-5 business days" or "COD Available").
