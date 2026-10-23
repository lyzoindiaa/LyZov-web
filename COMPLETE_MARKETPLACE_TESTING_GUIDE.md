# LyZov Marketplace — Complete Step-by-Step Testing & Operations Guide
### *A Plain-English, Non-Technical Manual for Testing Every Marketplace Feature*

> **Target Audience:** Store owners, business operations, non-IT managers, quality testers, and marketplace sellers.  
> **Branch:** `feat/multi-seller-marketplace`  
> **Last Updated:** October 2026

---

## Table of Contents
1. [Starting the Application (Simple 2-Step Setup)](#1-starting-the-application)
2. [Setting Up Your Admin User in the Database](#2-setting-up-your-admin-user)
3. [Ready-to-Use Test Accounts Cheat Sheet](#3-test-accounts-cheat-sheet)
4. [The 9 Step-by-Step Testing Journeys](#4-step-by-step-testing-journeys)
   - [Journey 1: Seller Onboarding (How a Merchant Registers)](#journey-1-seller-onboarding)
   - [Journey 2: KYC Verification (Reviewing Merchant Documents)](#journey-2-kyc-verification)
   - [Journey 3: Creating Products & Setting Up a Store](#journey-3-creating-products)
   - [Journey 4: SuperAdmin Product Moderation (Quality Control)](#journey-4-product-moderation)
   - [Journey 5: Customer Shopping & Multi-Seller Cart](#journey-5-customer-shopping)
   - [Journey 6: Multi-Package Order Tracking](#journey-6-multi-package-tracking)
   - [Journey 7: Seller Order Dispatch & Status Synchronization](#journey-7-seller-order-dispatch)
   - [Journey 8: Seller Payouts, Escrow Holding & Bank Transfers](#journey-8-seller-payouts-and-escrow)
   - [Journey 9: Customer Product Reviews & Verified Badges](#journey-9-product-reviews)
5. [Complete Non-IT Testing Checklist (Check off as you test)](#5-complete-testing-checklist)
6. [Simple Troubleshooting & FAQs](#6-troubleshooting--faqs)

---

## 1. Starting the Application

To run and test the complete application on your computer:

### Step A: Start the Backend Server (Handles Database & Business Logic)
1. Open a terminal or Command Prompt window.
2. Run these two commands:
   ```powershell
   cd d:\Lyzov\New_gentlemen_2.O\backend\server
   npm run dev
   ```
3. You will see:
   ```text
   MongoDB Connected: clusterlyzov...
   Server running in development mode on port 5000
   ```

### Step B: Start the Frontend Website (What Customers & Sellers See)
1. Open a **second** terminal window.
2. Run these two commands:
   ```powershell
   cd d:\Lyzov\New_gentlemen_2.O\frontend\client
   npm run dev
   ```
3. Open your web browser and go to: **`http://localhost:5173`**

---

## 2. Setting Up Your Admin User

To access the Super Admin control panel, your user account must have the **`role: "admin"`** in the database.

### Option 1: Using the Automated Seed Script (Recommended)
Once your computer's IP address is added to your MongoDB Atlas Network Access:
```powershell
cd d:\Lyzov\New_gentlemen_2.O\backend\server
npm run seed:admin
```
This automatically sets up:
- **SuperAdmin:** `admin@lyzov.com` / `Admin@1234`
- **Verified Seller:** `seller@lyzov.com` / `Seller@1234`
- **Customer:** `customer@lyzov.com` / `Customer@1234`

### Option 2: Making Any Account an Admin via MongoDB Atlas (Manual)
If you register a new account through the website (e.g. `yourname@gmail.com`) and want to make it a Super Admin:
1. Log into your **MongoDB Atlas** dashboard at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Click **Database** → **Browse Collections**.
3. Select database **`TblLyZov`** → collection **`users`**.
4. Search for your email:
   ```json
   { "email": "yourname@gmail.com" }
   ```
5. Click the **Edit Document (Pencil Icon)**.
6. Change the `"role"` field from `"customer"` or `"seller"` to:
   ```json
   "role": "admin"
   ```
7. Click **Update**. Log out and log back in on `http://localhost:5173/login`. You now have complete Super Admin authority!

---

## 3. Test Accounts Cheat Sheet

| Role | Email | Password | What You Can Access & Test |
|---|---|---|---|
| **Super Admin** | `admin@lyzov.com` | `Admin@1234` | Full platform dashboard, Seller directory, KYC approvals, Product moderation queue, and Bank payout releases at `/admin` |
| **Merchant Seller** | `seller@lyzov.com` | `Seller@1234` | Merchant analytics, Add/edit products, Manage incoming sub-orders, View escrow balance & bank payouts at `/seller` |
| **Customer** | `customer@lyzov.com` | `Customer@1234` | Browse storefronts, multi-vendor cart, place orders, track multiple shipments, and submit verified product reviews at `/` |

---

## 4. Step-by-Step Testing Journeys

---

### Journey 1: Seller Onboarding (How a Merchant Registers)

There are two ways sellers join LyZov: **Self-Registration** and **SuperAdmin Invitation**.

#### Method A: Self-Service Registration (For new merchants)
1. Open an incognito browser window and go to: `http://localhost:5173/seller/register`.
2. Fill out the merchant form:
   - **Full Name:** `Arjun Kapoor`
   - **Email:** `arjun@jaipurtextiles.com`
   - **Password:** `Seller@1234`
   - **Store/Business Name:** `Jaipur Royal Silks`
   - **Phone:** `+91 9876543210`
   - **Store Description:** `Handmade authentic royal silks and jackets.`
3. Click **"Register as Seller"**.
4. The system automatically creates a clean web link (slug) for their store: `http://localhost:5173/store/jaipur-royal-silks`.
5. You are redirected to your seller portal with a notice: *"Your KYC is pending verification"*.

#### Method B: Admin Direct Invitation (VIP Onboarding)
1. Log in as Super Admin (`admin@lyzov.com`).
2. Go to `http://localhost:5173/admin/sellers`.
3. Click the **"Invite New Seller"** button.
4. Enter business name, email, phone, and optional custom commission rate (e.g. `8%`).
5. Click **"Send Invitation"**.
6. The system generates login credentials, sends an email invitation, and provides a 1-click WhatsApp message button to invite the seller directly!

---

### Journey 2: KYC Verification (Reviewing Merchant Documents)

To prevent fraud, new sellers cannot list products until their business documents are reviewed.

#### Step 1: Seller Submits Documents
1. Log in as the new seller (`arjun@jaipurtextiles.com`).
2. Click **Profile & KYC** in the left menu (or go to `http://localhost:5173/seller/profile`).
3. Under **KYC Documents**:
   - Enter **PAN Number** (e.g. `ABCDE1234F`).
   - Enter **Aadhaar Number** (e.g. `1234 5678 9012`).
   - Upload sample PAN Card image and sample Aadhaar image.
4. Under **Bank Settlement Details** (where they receive money):
   - **Bank Name:** `HDFC Bank`
   - **Account Holder:** `Jaipur Royal Silks`
   - **Account Number:** `50100987654321`
   - **IFSC Code:** `HDFC0001234`
5. Click **"Save Profile & Submit KYC"**.
6. Notice that the page displays: **"KYC Documents Submitted & Under Review"**.

#### Step 2: Super Admin Reviews & Approves
1. Log in as Super Admin (`admin@lyzov.com`).
2. Go to **Sellers Directory** (`http://localhost:5173/admin/sellers`).
3. Click on `Jaipur Royal Silks`.
4. In the seller details view:
   - Observe that the PAN number is securely masked (`ABCDE****F`) and Aadhaar is masked (`•••• •••• 9012`) to protect privacy.
   - Click **"View Secure Doc"** next to the PAN or Aadhaar document. A signed 10-minute secure link opens the image.
   - Click the green **"Approve KYC"** button.
5. The seller's badge changes to a green checkmark: **"Verified"**.

---

### Journey 3: Creating Products & Setting Up a Store

Now that the seller is verified, they can add items to their personal catalog.

1. Log in as the seller (`arjun@jaipurtextiles.com`).
2. Click **Products** → **Add Product** (`http://localhost:5173/seller/products/add`).
3. Fill in product details:
   - **Product Name:** `Royal Embroidered Silk Sherwani`
   - **Category:** Select `Men` (or relevant subcategory).
   - **Price:** `₹4,999`
   - **Original MRP:** `₹7,999`
   - **Stock Quantity:** `25`
   - **Description:** `Exquisite handcrafted silk sherwani with golden zari embroidery.`
   - **Images:** Upload 1 to 3 photos.
4. Click **"Publish Product"**.
5. Notice the product status:
   - It is created and queued for **Moderation Approval** (`pending_approval`).
6. Visit the seller's public storefront: `http://localhost:5173/store/jaipur-royal-silks`.
   - The store banner, store logo, verified badge, and merchant bio appear cleanly!

---

### Journey 4: SuperAdmin Product Moderation (Quality Control)

Before merchant products appear in the live shopping section, Super Admin checks them for quality and accuracy.

1. Log in as Super Admin (`admin@lyzov.com`).
2. Click **Product Moderation** in the sidebar (`http://localhost:5173/admin/moderation`).
3. You will see `Royal Embroidered Silk Sherwani` under **Pending Approval**:
   - Shows thumbnail photo, product name, category, price, and merchant store name.
   - You can click **"Preview"** to see how the product looks to customers.
4. **Testing Rejection (Optional):**
   - Click **"Reject"**.
   - A modal opens asking for feedback.
   - Type: *"Please add high-resolution photos on a clean white background."*
   - Click **"Confirm Rejection"**. The seller will see this note in their dashboard.
5. **Testing Approval:**
   - Click the green **"Approve"** button.
   - The product is approved instantly and becomes visible to all customers across the website!

---

### Journey 5: Customer Shopping & Multi-Seller Cart

Customers can shop from multiple independent sellers in one single cart.

1. Open your browser and go to the homepage: `http://localhost:5173/shop`.
2. Find the product added by Seller A (`Royal Embroidered Silk Sherwani`).
   - Notice the vendor badge on the page: **"Sold & Fulfilled by: Jaipur Royal Silks"** (clicking it takes you to their store).
   - Click **"Add to Cart"**.
3. Now find a different product from another seller or platform admin (e.g. a pair of shoes or casual shirt).
   - Click **"Add to Cart"**.
4. Click the **Cart Icon** at the top right:
   - Both items appear in your cart.
5. Click **"Proceed to Checkout"** (`http://localhost:5173/checkout`).
6. Enter delivery shipping address and select **"Cash on Delivery"** (or Razorpay test mode).
7. Click **"Place Order"**.
8. Success! You will receive a master order number (e.g. `#NC-84920`).

---

### Journey 6: Multi-Package Order Tracking

Behind the scenes, the order was automatically split so each seller handles their own items.

1. In your customer account, go to **My Orders** (`http://localhost:5173/dashboard/orders`).
2. Click **"View Order Details"** on your recent order.
3. Observe the **"Shipment Packages (2 Dispatches)"** section:
   - **Package 1:** Contains the Silk Sherwani, fulfilled by *Jaipur Royal Silks*, with its own status tracker (`Processing`).
   - **Package 2:** Contains the second item, fulfilled by the second seller, with its own separate tracker.
   - Customer can track both shipments independently with separate courier tracking numbers!

---

### Journey 7: Seller Order Dispatch & Status Synchronization

Each seller receives only their portion of the order and manages fulfillment.

1. Log in as Seller A (`arjun@jaipurtextiles.com`).
2. Go to **Orders** (`http://localhost:5173/seller/orders`).
3. You see **only Sub-Order 1** (`NC-84920-S01`). You do **not** see other sellers' products (zero data leakage).
4. Click on the order to open details:
   - Shows customer shipping address.
   - Shows your items and your net earnings after commission.
5. In the status dropdown, change status from **"Pending"** to **"Shipped"**.
6. Enter a courier name (e.g. `BlueDart`) and Tracking AWB (e.g. `BD-998877`).
7. Click **"Update Shipment"**.
8. **Check Status Synchronization:**
   - As a customer, view your master order: Package 1 now shows **"Shipped"** with BlueDart tracking.
   - When Seller B also marks Package 2 as **"Shipped"**, the master order automatically updates its overall status to **"Shipped"**!

---

### Journey 8: Seller Payouts, Escrow Holding & Bank Transfers

LyZov protects customers by holding payout money in escrow during the 7-day return period before sending it to the seller's bank.

#### What the Seller Sees:
1. As the seller, click **Payouts & Escrow** in the menu (`http://localhost:5173/seller/payouts`).
2. You will see:
   - **Escrow Balance:** Shows money currently held safely in the 7-day return window.
   - **Eligible Balance:** Money whose 7 days have passed and is ready to be transferred.
   - **Disbursed to Bank:** Total money already paid out.
   - **Settlement Bank Account:** Displays your HDFC Bank account snapshot.
   - **Ledger Table:** Lists each SubOrder, the sale price, the 10% platform commission deduction, and your net earnings.

#### What the Super Admin Does to Pay the Seller:
1. Log in as Super Admin (`admin@lyzov.com`).
2. Go to **Marketplace Payouts** (`http://localhost:5173/admin/payouts`).
3. You will see all pending payouts across all sellers.
4. Click the **"Release"** button next to an eligible payout.
5. A modal appears showing the seller's bank account number and IFSC code.
6. Enter the Bank UTR / NEFT Reference (e.g. `UTR-HDFC-88223344`) and click **"Confirm Disbursement"**.
7. The payout status immediately updates to **"Released"**.
8. Refresh the seller's portal: The money moves to **"Disbursed to Bank"** with the UTR number recorded for their tax accountant!

---

### Journey 9: Customer Product Reviews & Verified Badges

Customers who purchase items can leave ratings, reviews, and photos.

1. Log in as the customer (`customer@lyzov.com`).
2. Go to the product page of the item you purchased (`http://localhost:5173/product/...`).
3. Click on the **"Customer Reviews"** tab:
   - See the star rating summary: Overall score (e.g. `4.8 ★`) and breakdown bars for 5, 4, 3, 2, 1 stars.
4. Click **"Write a Review"**.
5. In the review window:
   - Hover and click on **5 Stars** (shows *"Outstanding"*).
   - Enter Headline: *"Remarkable quality and rich fabric!"*
   - Enter Detailed Review: *"The silk texture is luxurious, stitching is clean, and arrived well packed."*
   - (Optional) Click **"+ Photo"** to attach a photo.
6. Click **"Submit Review"**.
7. Your review appears immediately at the top of the reviews list!
   - Shows the green **"Verified Buyer"** badge because the system verified that you actually bought this product!
8. Click the **"Helpful"** button:
   - The helpful count increments (e.g. `Helpful (1)`) with instant visual confirmation.

---

## 5. Complete Testing Checklist

Print or use this checklist to test the entire marketplace end-to-end:

### A. Seller Onboarding & KYC
- [ ] Merchant can register via `/seller/register` with business name and store details.
- [ ] System automatically generates clean URL store slug (e.g. `/store/my-shop`).
- [ ] Merchant can fill bank account details and upload PAN & Aadhaar photos at `/seller/profile`.
- [ ] SuperAdmin can view masked PAN (`ABCDE****F`) and masked Aadhaar at `/admin/sellers`.
- [ ] SuperAdmin can open signed secure KYC image links without link expiration issues.
- [ ] SuperAdmin can approve KYC with 1-click button.

### B. Catalog & Product Moderation
- [ ] Verified seller can add a product with pricing, variants, and stock at `/seller/products/add`.
- [ ] Newly added merchant product is marked as `pending_approval`.
- [ ] SuperAdmin can view pending listings at `/admin/moderation`.
- [ ] SuperAdmin can reject a listing with custom quality feedback.
- [ ] SuperAdmin can approve a listing, making it immediately live in the store.
- [ ] Public store page (`/store/:storeSlug`) shows merchant banner, verified badge, and products.

### C. Shopping & Multi-Seller Checkout
- [ ] Customer can add items from Seller A and Seller B into a single cart.
- [ ] Customer completes checkout via COD or Razorpay.
- [ ] System atomically creates 1 master `Order` and 2 independent `SubOrder` records.
- [ ] Customer order details page displays separate shipment tracking cards for each seller.

### D. Order Fulfillment & Dispatch
- [ ] Seller A logs in and sees **only** their items in `/seller/orders`.
- [ ] Seller A marks sub-order as `shipped` with tracking number.
- [ ] Master order stays `processing` until Seller B also dispatches.
- [ ] When all sellers dispatch, master order automatically updates to `shipped`.

### E. Financials & Payouts Escrow
- [ ] Payout record is automatically created for each sub-order with net earnings calculated.
- [ ] 10% platform commission is automatically deducted.
- [ ] Seller can view their Escrow Balance held during 7-day return window at `/seller/payouts`.
- [ ] SuperAdmin can review all payouts and release money with bank UTR at `/admin/payouts`.
- [ ] Seller sees disbursement confirmation and UTR reference number.

### F. Product Reviews & Verified Badges
- [ ] Customer can open "Customer Reviews" tab and view star rating breakdown bars.
- [ ] Customer can open review modal, select 1–5 stars, write comments, and attach photos.
- [ ] Review appears with green `Verified Buyer` badge for verified purchasers.
- [ ] Customers can click "Helpful" to upvote reviews.

---

## 6. Troubleshooting & FAQs

### Q1: I see "MongoDB connection failed: IP that isn't whitelisted".
- **What it means:** MongoDB Atlas security is blocking your internet connection IP.
- **How to fix:**
  1. Open [cloud.mongodb.com](https://cloud.mongodb.com).
  2. Click **Network Access** in the left sidebar.
  3. Click **Add IP Address** → Click **"Allow Access from Anywhere"** (`0.0.0.0/0`) or **"Add Current IP Address"**.
  4. Click **Confirm**. Wait 30 seconds and restart your backend server.

### Q2: A seller says they cannot add products.
- **Reason:** Their KYC is still `pending` or was `rejected`.
- **How to fix:** Log in as Super Admin (`admin@lyzov.com`), go to `/admin/sellers`, find the seller, and click **"Approve KYC"**.

### Q3: How do I change the platform commission rate for a specific seller?
- Go to `/admin/sellers`, click on the seller, and update their **Commission Rate** field (e.g. from `10%` to `8%` or `15%`). All future orders will calculate fees based on their custom rate.

### Q4: When does escrow money become eligible for release?
- By default, customer returns are allowed for 7 days. Money moves from **Escrow Balance** to **Eligible Balance** 7 days after the order date. Super Admin can then disburse it via `/admin/payouts`.
