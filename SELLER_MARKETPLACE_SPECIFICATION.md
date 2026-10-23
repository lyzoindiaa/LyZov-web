# LyZov Multi-Seller Marketplace — Architecture & Testing Specification

> **Branch:** `feat/multi-seller-marketplace`  
> **Status:** Fully Implemented & Verified (17/17 Automated Tests Passing)  
> **Target Audience:** Engineering, QA, System Architects, and Platform Administrators

---

## 1. Executive Summary

LyZov has evolved from a single-vendor retail platform into an enterprise-grade **multi-seller marketplace**. This architecture enables independent merchants to register, undergo rigorous KYC verification, manage their dedicated product catalogs, process sub-orders in tenant isolation, and receive transparent financial payouts.

### Key Architectural Pillars
- **Strict Tenant Isolation (Zero IDOR):** Sellers can only view, edit, or delete their own products and orders. Product mutations by unverified sellers are strictly blocked at middleware level.
- **Split-Order Fulfillment Architecture:** When a customer purchases items from multiple distinct sellers in a single checkout, the platform atomically creates a parent `Order` (for customer tracking) and isolated `SubOrder` records (for each individual merchant).
- **Status Rollup Engine:** Individual merchant package dispatches independently update their sub-order. When all sibling sub-orders reach `shipped` or `delivered`, the master parent order automatically synchronizes status.
- **Auditable Financial Ledger:** Proportional calculation of itemsPrice, tax, discount, shipping, platform commission, and seller earnings with an automated 7-day return window holding period.
- **Secure KYC & Privacy Protection:** Automatic store slug generation, cryptographic storage, masked identification fields (`ABCDE****F`, `•••• •••• 9012`), and 10-minute expiring signed Cloudinary URLs for KYC documents.

---

## 2. Core Database Models & Schema Extensions

### 2.1 `User` Model ([backend/server/models/User.js](file:///d:/Lyzov/New_gentlemen_2.O/backend/server/models/User.js))
| Field | Type | Description |
|---|---|---|
| `role` | String | `"customer"`, `"seller"`, or `"admin"` |
| `sellerProfile.storeSlug` | String (Unique) | URL-friendly merchant store slug (auto-generated via pre-save hook) |
| `sellerProfile.commissionRate` | Number | Platform fee percentage (default: `10%`) |
| `sellerProfile.onboardingSource` | String | `"invite"` (admin provisioned) or `"self"` (public registration) |
| `sellerProfile.kycStatus` | String | `"pending"`, `"verified"`, or `"rejected"` |
| `sellerProfile.kycReviewedBy` | ObjectId | SuperAdmin who approved/rejected verification |
| `sellerProfile.kycReviewedAt` | Date | Verification timestamp |
| `toSafeObject({ revealKyc })` | Method | Masks PAN and Aadhaar; nullifies raw private document URLs unless `revealKyc: true` |

### 2.2 `Product` Model ([backend/server/models/Product.js](file:///d:/Lyzov/New_gentlemen_2.O/backend/server/models/Product.js))
| Field | Type | Description |
|---|---|---|
| `seller` | ObjectId (Ref: User) | Merchant owner of the product; indexed for fast storefront queries |
| `moderationStatus` | String | `"draft"`, `"pending_approval"`, `"approved"`, `"rejected"` (default: `"approved"`) |
| `moderationFeedback` | String | Feedback or reason provided by SuperAdmin during moderation review |

### 2.3 `SubOrder` Model ([backend/server/models/SubOrder.js](file:///d:/Lyzov/New_gentlemen_2.O/backend/server/models/SubOrder.js))
| Field | Type | Description |
|---|---|---|
| `parentOrder` | ObjectId (Ref: Order) | Link to the master customer order |
| `subOrderNumber` | String | Unique human-readable sub-order code (`NC-XXXXXX-S01`) |
| `seller` | ObjectId (Ref: User) | Assigned merchant |
| `customer` | ObjectId (Ref: User) | Customer recipient |
| `items` | Array | Only the items belonging to this specific seller |
| `commissionRate` | Number | Commission percentage applied to this sub-order |
| `commissionAmount` | Number | Platform commission deducted |
| `sellerEarnings` | Number | Net merchant payout (`totalPrice - commissionAmount`) |
| `payoutStatus` | String | `"pending"`, `"eligible"`, `"paid"`, `"cancelled"` |
| `orderStatus` | String | `"pending"`, `"processing"`, `"shipped"`, `"delivered"`, `"cancelled"`, `"returned"` |

### 2.4 `Payout` Model ([backend/server/models/Payout.js](file:///d:/Lyzov/New_gentlemen_2.O/backend/server/models/Payout.js))
| Field | Type | Description |
|---|---|---|
| `seller` | ObjectId (Ref: User) | Payee merchant |
| `subOrder` | ObjectId (Ref: SubOrder) | Originating sub-order |
| `netAmount` | Number | Payout amount held in escrow |
| `eligibleAt` | Date | Timestamp after 7-day return window elapses |
| `status` | String | `"pending"`, `"eligible"`, `"processing"`, `"completed"`, `"failed"` |
| `bankDetailsSnapshot` | Object | Immutable snapshot of account holder, account number, IFSC, and bank name |
| `transactionReference` | String | Bank UTR / NEFT / IMPS reference entered by admin upon disbursement |

---

## 3. Role-Based Access Control (RBAC) Matrix

| Endpoint | Customer | Seller (Unverified) | Seller (Verified) | SuperAdmin |
|---|:---:|:---:|:---:|:---:|
| `POST /api/auth/seller/register` | Public | Public | Public | Public |
| `GET /api/products/store/:storeSlug` | Allowed | Allowed | Allowed | Allowed |
| `POST /api/products` (Create) | Blocked (403) | Blocked (403 - KYC Gated) | Allowed (Own products) | Allowed |
| `PUT /api/products/:id` (Update) | Blocked (403) | Blocked (403) | Allowed (Own only) | Allowed (Any) |
| `DELETE /api/products/:id` (Delete) | Blocked (403) | Blocked (403) | Allowed (Own only) | Allowed (Any) |
| `GET /api/orders` | Customer Orders | Own SubOrders | Own SubOrders | Master Orders |
| `PUT /api/orders/:id/status` | Blocked (403) | Blocked (403) | Allowed (Own SubOrder) | Allowed (Any) |
| `GET /api/admin/sellers/:id/kyc-document/:type` | Blocked (403) | Blocked (403) | Blocked (403) | Allowed (Signed URL) |
| `POST /api/admin/payouts/:id/release` | Blocked (403) | Blocked (403) | Blocked (403) | Allowed |
| `PUT /api/settings` (Platform settings) | Blocked (403) | Blocked (403) | Blocked (403) | Allowed |

---

## 4. End-to-End Workflows

```
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│ Seller Registers│ ────> │ Completes KYC   │ ────> │ SuperAdmin Review│
│ (Self/Invite)   │       │ (PAN + Aadhaar) │       │ (Approve/Reject) │
└─────────────────┘       └─────────────────┘       └─────────┬────────┘
                                                              │
                                                              ▼
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│ Storefront Live │ <──── │ Publish Products│ <──── │ KYC Verified     │
│ /store/:slug    │       │ (requireVerified│       │ (requireVerified │
└────────┬────────┘       └─────────────────┘       └──────────────────┘
         │
         ▼
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│ Multi-Seller    │ ────> │ Parent Order +  │ ────> │ SubOrders        │
│ Cart & Checkout │       │ Atomic SubOrders│       │ Dispatched       │
└─────────────────┘       └─────────────────┘       └─────────┬────────┘
                                                              │
                                                              ▼
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│ Platform Fee    │ <──── │ Admin Releases  │ <──── │ 7-Day Return     │
│ Retained        │       │ Bank Payout     │       │ Window Cleared   │
└─────────────────┘       └─────────────────┘       └──────────────────┘
```

---

## 5. API Reference

### 5.1 Seller Onboarding & Registration
- **`POST /api/auth/seller/register`**
  - **Payload:**
    ```json
    {
      "name": "Arun Kumar",
      "email": "arun@royalheritagetextiles.com",
      "password": "StrongPassword123!",
      "phone": "9876543210",
      "businessName": "Royal Heritage Textiles",
      "storeBio": "Finest handwoven silks and bespoke kurtas from Varanasi."
    }
    ```
  - **Response (201):**
    ```json
    {
      "success": true,
      "message": "Seller account registered successfully",
      "data": {
        "user": {
          "_id": "67...a1",
          "name": "Arun Kumar",
          "email": "arun@royalheritagetextiles.com",
          "role": "seller",
          "sellerProfile": {
            "businessName": "Royal Heritage Textiles",
            "storeSlug": "royal-heritage-textiles",
            "kycStatus": "pending"
          }
        },
        "accessToken": "eyJhbGciOi...",
        "redirectTo": "/seller/profile"
      }
    }
    ```

### 5.2 Public Storefront
- **`GET /api/products/store/:storeSlug`**
  - **Response (200):**
    ```json
    {
      "success": true,
      "data": {
        "seller": {
          "id": "67...a1",
          "name": "Arun Kumar",
          "businessName": "Royal Heritage Textiles",
          "storeBio": "Finest handwoven silks and bespoke kurtas from Varanasi.",
          "storeSlug": "royal-heritage-textiles",
          "rating": 4.9,
          "isVerified": true
        },
        "products": [
          {
            "_id": "67...b2",
            "title": "Bespoke Raw Silk Kurta",
            "price": 3499,
            "images": [{ "url": "https://..." }]
          }
        ]
      }
    }
    ```

### 5.3 Secure KYC Document Access
- **`GET /api/admin/sellers/:id/kyc-document/:docType`** (`docType`: `"pan"` or `"aadhaar"`)
  - **Auth:** SuperAdmin only (`Bearer <token>`)
  - **Response (200):** Returns time-limited signed Cloudinary download URL expiring in 10 minutes.

### 5.4 Seller Payout Management
- **`GET /api/admin/payouts`**
  - Returns paginated list of all marketplace payouts filterable by `status` (`pending`, `eligible`, `completed`).
- **`POST /api/admin/payouts/:id/release`**
  - **Payload:** `{ "transactionReference": "UTR-HDFC-1234567890", "notes": "Weekly batch settlement" }`
  - **Effect:** Payout status transitions to `completed`, records `paidAt` timestamp, and flips the corresponding SubOrder `payoutStatus` to `"paid"`.

---

## 6. How to Test (Automated & Manual)

### 6.1 Automated Test Execution

The codebase contains a comprehensive automated test suite built on Node 23's native test runner (`node:test`). To execute all tests:

```powershell
cd d:\Lyzov\New_gentlemen_2.O\backend\server
node --test tests/test_multi_seller_marketplace.js
```

To run the complete test directory (including cancel & exchange lifecycle tests):
```powershell
node --test tests/test_cancel_exchange_flow.js tests/test_multi_seller_marketplace.js
```

#### Verified Test Coverage:
1. `TEST-MS-01`: Auto Store Slug Generation & Safe Object KYC Masking (PAN/Aadhaar masking, private Cloudinary doc isolation).
2. `TEST-MS-02`: RBAC & KYC Gating Middleware (`requireVerifiedSeller` blocks unverified sellers, passes verified sellers & admins).
3. `TEST-MS-03`: Multi-Seller Product Isolation & IDOR Protection (Seller B blocked from updating or deleting Seller A's product).
4. `TEST-MS-04`: Multi-Seller Checkout & SubOrder Splitting (Calculates proportional commission, net earnings, and spawns SubOrders + Payouts).
5. `TEST-MS-05`: SubOrder Tenancy & Order List Isolation (Seller A only sees their own SubOrders; aliased `orderNumber` for UI).
6. `TEST-MS-06`: SubOrder Fulfillment & Parent Status Rollup (Sibling sub-order completion automatically synchronizes master order status).
7. `TEST-MS-07`: Marketplace Payout Release Lifecycle (Admin settlement transitions payout to completed and sub-order to paid).
8. `TEST-MS-08`: Privilege Escalation Protection (Seller blocked from platform settings modifications).

---

### 6.2 Manual Testing Guide via UI

#### Step 1: Merchant Self-Registration
1. Navigate to `http://localhost:5173/seller/register` (or click **"Sell on LyZov"** in the footer).
2. Fill in the partner registration form:
   - Name: `Dev Sharma`
   - Store Name: `Jaipur Craft Works`
   - Email: `seller@jaipurcraft.com`
   - Password: `Password123!`
3. Click **"Register as Merchant Partner"**.
4. The system logs you in and redirects to `/seller/profile`.

#### Step 2: KYC Submission
1. In the Seller Portal (`/seller/profile`), enter:
   - PAN Number: `ABCDE1234F`
   - Aadhaar Number: `123456789012`
   - Upload PAN & Aadhaar documents.
   - Enter Bank Details (Account Holder, Account Number, IFSC, Bank Name).
2. Save profile. Notice status is `pending`.

#### Step 3: Admin Review & KYC Approval
1. Log in as SuperAdmin and navigate to `http://localhost:5173/admin/sellers`.
2. Click on `Jaipur Craft Works`.
3. In the KYC Verification card, click **"View Secure Doc"** next to PAN or Aadhaar. Notice that the link generates a signed, authenticated Cloudinary URL.
4. Click **"Approve KYC"**. The seller's status updates to `verified`.

#### Step 4: Catalog Creation & Storefront Verification
1. As the verified seller, navigate to `http://localhost:5173/seller/products/add`.
2. Create a product (e.g., `Hand-Block Printed Silk Shirt`, Price: ₹2499).
3. Open public store: `http://localhost:5173/store/jaipur-craft-works`.
4. Verify the seller banner, verified merchant badge, and catalog item display.
5. Open the product details page (`/product/...`). Verify the **"Sold & Fulfilled by: Jaipur Craft Works"** badge links back to the storefront.

#### Step 5: Multi-Seller Checkout & Splitting
1. As a customer, add:
   - 1 item from Seller A (Jaipur Craft Works)
   - 1 item from Seller B (or platform admin)
2. Proceed to checkout and complete order (COD or Razorpay).
3. Log in as Seller A: Go to `/seller/orders`. You will see **ONLY Sub-Order 1** (`NC-XXXX-S01`) with your items and earnings.
4. Log in as SuperAdmin: Go to `/admin/dashboard`. You will see master Order `NC-XXXX` with both sub-orders linked.

#### Step 6: Fulfillment & Status Sync
1. Seller A marks Sub-Order 1 as `shipped` with tracking number `AWB-TEST-01`.
2. Notice master Order remains `processing` because Seller B has not dispatched yet.
3. Seller B marks Sub-Order 2 as `shipped` with tracking number `AWB-TEST-02`.
4. Refresh master Order: It has automatically updated to `shipped`!
