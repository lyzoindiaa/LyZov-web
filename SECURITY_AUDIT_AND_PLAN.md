# LyZov — Security Audit, Auth Refactor & Razorpay Migration Plan

- **Branch:** `security/refresh-token-and-order-hardening` (cut from `origin/main` @ `8e11d7e`)
- **Status:** PLAN ONLY — no application code changed on this branch yet.
- **Scope audited in depth:** order/checkout/payment, cart, coupons, auth/session (backend + `api.js`), route guards, shipping webhook, public tracking.
- **Not yet audited (Phase 0 checklist, see §7):** product/category/brand/review/user/email controllers, upload middleware, prerender service, admin analytics, frontend XSS surface.

> Every finding below cites the file/lines it was read from. "Verified" = reproduced by reading the code path end-to-end. "To verify" = suspicious, needs a live test.

---

## 1. Executive summary

| # | Theme | Worst finding | Severity |
|---|-------|---------------|----------|
| 1 | Payment bypass | One succeeded Stripe PaymentIntent can fund **unlimited orders**, and its amount is **never compared** to the order total | **Critical** |
| 2 | Quantity/price bypass | Quantity or price can change between "pay" and "place order"; cart prices are snapshots never re-priced | **Critical** |
| 3 | Test-payment bypass | No `livemode` check → test keys/cards produce orders that are treated as paid | **High** |
| 4 | Auth/CORS | CORS reflects *every* origin with credentials on `SameSite=None` cookies | **High** |
| 5 | Sessions | Refresh-token rotation races → **multi-tab random logout**; no cross-tab sync | **High (UX)** |
| 6 | Webhooks / PII | Unauthenticated Delhivery webhook mutates order state; public tracking can be guessed with 1 digit | **High** |

**Answer to "do security patches fix the test-payment bypass?"** Not today — nothing in the repo prevents it. §3 (P1–P5) is the patch set; it is also a hard prerequisite for the Razorpay cut-over (the same checks must exist on the new provider).

---

## 2. Findings — quantity / price / payment bypass

### P1 — PaymentIntent replay (Critical, verified)
`createOrder` ([orderController.js:224-243](backend/server/controllers/orderController.js)) checks only `intent.status === "succeeded"` and (weakly) the user. Nothing records that an intent was *consumed*, and `Order.paymentResult.id` has no unique index ([Order.js:60-68](backend/server/models/Order.js)).
**Exploit:** pay ₹X once → refill cart → `POST /api/orders {paymentMethod:"stripe", paymentIntentId:<same>}` repeatedly. Each order is `isPaid:true`.
**Fix:** unique sparse index on payment id; atomic "claim" (`findOneAndUpdate` / insert-then-catch-duplicate) before stock deduction.

### P2 — Amount never verified; quantity changes after payment (Critical, verified)
`createPaymentIntent` computes `totalPrice` from the cart at time T1 ([orderController.js:194-201](backend/server/controllers/orderController.js)). `createOrder` at T2 recomputes totals from the *current* cart ([:270](backend/server/controllers/orderController.js)) and **never compares** it to `intent.amount` / `amount_received`.
**Exploit (quantity):** cart with 1 cheap item → get intent → pay → add/raise quantity (or add expensive items; the cart routes let you) → `POST /api/orders` with that intent → order for the full cart is marked paid. The reverse (reduce quantity after paying) silently keeps the customer's overpayment with no refund/reconciliation.
**Fix:** order is created **before** payment with server-computed totals and the payment provider order/intent is bound to that order id; verification asserts `amount === order.totalPrice` (in minor units), currency, and order binding. Cart is frozen (snapshot) once payment starts.
> Note: cart routes already reject negative/fractional quantities (`isInt({min:1})`, [cartRoutes.js:24,31](backend/server/routes/cartRoutes.js)), and stock decrement is atomic with `$gte`, so stock cannot go negative. The bypass is *temporal* (cart mutates after payment), not a bad-input bypass.

### P3 — Test-mode payments accepted (High, verified)
No `intent.livemode` assertion; `STRIPE_SECRET_KEY` is used blindly ([config/stripe.js](backend/server/config/stripe.js)); the frontend `.env` ships a `pk_test_…` key. If production runs on test keys (or a test key leaks into prod env), `4242 4242 4242 4242` creates a *real, fulfilled* order.
**Fix:** boot-time guard (`NODE_ENV=production` ⇒ key must be live; else refuse to start / disable online payment) **and** per-payment assertion (`livemode`/key prefix). Applies identically to Razorpay (`rzp_live_` vs `rzp_test_`).

### P4 — Weak ownership check (High, verified)
`if (intent.metadata?.userId && intent.metadata.userId !== req.user._id…)` ([:230](backend/server/controllers/orderController.js)) passes when metadata is **absent**. Make it strict (`!==` required, absent ⇒ reject).

### P5 — Charged but no order / no reconciliation (High, verified)
Stock is deducted *after* payment is verified ([:266](backend/server/controllers/orderController.js)). If any item went out of stock meanwhile, the request errors **after the customer was charged** and nothing refunds or retries. No webhook exists to recover from closed tabs/timeouts.
**Fix:** stock reservation (TTL) at payment start + provider webhook reconciliation + auto-refund on unfulfillable paid orders.

### P6 — Cart price snapshot trusted (High, verified)
`addItemToCart` stores `price` once ([cartController.js:63-77](backend/server/controllers/cartController.js)); `createOrder` charges `item.price` from the cart ([:274-283](backend/server/controllers/orderController.js)). Prices are never re-read from `Product`. A customer can hold an old low price indefinitely (after a price increase or discount expiry). *To verify:* variants — `addItemToCart` ignores any per-variant price.
**Fix:** re-price from DB at payment start and again at verification; reject/notify on drift.

### P7 — Coupon integrity (Medium, verified)
- `maxDiscountAmount` exists in the model but **is ignored** by `calculateTotals` ([:33-51](backend/server/controllers/orderController.js)).
- `percentage` > 100 is not capped; flat discount not capped to subtotal (clamped only via `Math.max(...,0)`).
- Discount is **snapshotted into the cart** at apply time (`discountValue`) — later admin edits/disable do not apply; recheck only validates the code, not the value.
- Redemption (`usedCount++`, `usersUsed.push`) is **non-atomic and after** order creation ([:303-308](backend/server/controllers/orderController.js)) → parallel orders can reuse a single-use coupon or exceed `usageLimit`.
**Fix:** compute discount from the *live* coupon doc at order time; atomic conditional redemption (`findOneAndUpdate` with `usersUsed:{$ne:user}`, `usedCount:{$lt:limit}`), rolled back if order creation fails.

### P8 — Cancel/refund races & ordering (Medium, verified)
`cancelOrder`/`adminCancelOrder` check status non-atomically, **restore stock first**, then attempt the refund ([:417-436](backend/server/controllers/orderController.js)). Concurrent calls double-restore stock (inventory inflation); a failed refund leaves stock restored while the order stays active, and can be repeated.
**Fix:** atomic status transition guard (`findOneAndUpdate({_id, orderStatus:{$nin:[...]}}, …)`), refund first (idempotency key), then restore stock exactly once.

### P9 — Status endpoint decoupled from money (Medium, verified)
`PUT /orders/:id/status` lets a seller set `refunded`/`cancelled` with **no refund**, and re-activating a cancelled order re-deducts stock ([:797-815](backend/server/controllers/orderController.js)); save errors fall back to `runValidators:false` ([:837-856](backend/server/controllers/orderController.js)). Route `refunded` through the refund service only; drop the validation-less fallback.

### P10 — COD abuse (Medium)
No per-user/day COD cap, no OTP/phone verification, stock is deducted immediately → cheap inventory denial. Add COD limits (max value, max open COD orders), phone OTP, and auto-cancel of unconfirmed COD.

### P11 — Exchange/return gaps (Low–Medium)
`processExchange` accepts `req.body.items` unvalidated (price/qty/product), is non-atomic (double exchange possible), and swallows stock failures with `console.warn` ([:690-730](backend/server/controllers/orderController.js)). `returnStatus:"Refunded"` exists but nothing issues a refund.

### P12 — Unauthenticated Delhivery webhook (High, verified)
`POST /api/shipping/webhook` is public and un-signed ([shippingRoutes.js:32](backend/server/routes/shippingRoutes.js), [shippingController.js:270](backend/server/controllers/shippingController.js)). Anyone who learns/guesses a waybill can push `Delivered`/`Returned`/`Cancelled` and move orders/returns. **Fix:** shared-secret header/HMAC + IP allowlist + idempotent, forward-only transitions.

### P13 — Public tracking is guessable & leaks PII (High, verified)
`trackOrderPublic` matches phone with `customerPhone.endsWith(inputPhone) || inputPhone.endsWith(customerPhone)` ([:1148](backend/server/controllers/orderController.js)) — a **single trailing digit** matches. Order numbers are `NC-<base36 time>-<4 digits>`; the route has no rate limit, and the response returns `customerPhone`, recipient name and city/state/pincode. **Fix:** exact normalised match, rate limit + lockout, drop phone from response, add a signed tracking token to confirmation emails.

---

## 3. Findings — authentication / session

### A1 — CORS allows every origin with credentials (High, verified)
[app.js:70-86](backend/server/app.js): both branches of the origin callback `return callback(null, true)`; `credentials:true`; prod cookies are `SameSite=None; Secure` ([generateTokens.js:23-43](backend/server/utils/generateTokens.js)). Any website can make authenticated cross-site calls and read responses. **Fix:** strict allow-list (`CLIENT_URL`, `lyzov.com`, `www.lyzov.com`, vercel previews if wanted) + CSRF defence (Origin/Referer check on mutating routes; or `SameSite=Lax` since the site now proxies `/api` same-origin).

### A2 — Refresh rotation race ⇒ random multi-tab logout (High UX, verified)
`refresh()` deletes the presented token the instant it rotates ([authController.js:296-309](backend/server/controllers/authController.js)). With 2+ tabs (access token = 15 min, so all tabs expire together) the second concurrent `/auth/refresh` carries the now-deleted token ⇒ 401 ⇒ `auth:logout`. This is the main reason users get logged out despite a 30-day cookie.

### A3 — Token storage & lifecycle (Medium, verified)
Refresh tokens are **plaintext** in `User.refreshTokens[]` ([User.js:124-129](backend/server/models/User.js)); no `jti`/family; no reuse-theft detection; array capped at **5** (`slice(-5)`) — the 6th login/tab/device silently evicts the oldest live session; no device/session list, no "log out everywhere"; `refresh()` does not check `isActive`.

### A4 — No cross-tab synchronisation (Medium, verified)
The access token lives in a module variable per tab ([api.js:13-21](frontend/client/src/services/api.js)); `auth:logout` is a same-window `CustomEvent` ([api.js:69](frontend/client/src/services/api.js), [App.jsx:73-82](frontend/client/src/App.jsx)). Logout/login/cart changes in tab A are invisible to tab B; no `BroadcastChannel`, `storage` event, or Web Locks anywhere in `src/`.

### A5 — Refresh failure hangs queued requests (Medium, verified)
[api.js:46-53,66-71](frontend/client/src/services/api.js): requests queued while `isRefreshing` are resolved only on success; on failure `refreshSubscribers` is never rejected/cleared → pending promises hang and stale callbacks leak into the next refresh.

### A6 — Smaller items
- Google signup e-mails a **plaintext temp password** ([authController.js:135-164](backend/server/controllers/authController.js)). Replace with "set your password" link.
- `/auth/refresh` and `/auth/google*` have no limiter; the shared `authLimiter` (20/15 min/IP) can lock out a whole NAT, with no per-account throttling.
- `clearAuthCookies` does not pass the same attributes used when setting ([generateTokens.js:45-48](backend/server/utils/generateTokens.js)) — make symmetrical.
- `register` auto-creates a session for an **unverified** email.
- Helmet CSP is only on in production (fine), but will need Razorpay hosts (§5.8).

### Current "stay logged in" behaviour (requirement: > 10 days)
The 30-day refresh cookie *already* exceeds 10 days and is sliding (re-issued on every rotation). It fails in practice because of A2/A3/A5 (races, eviction, hang), not because of the lifetime. Target below keeps/extends it and makes it reliable.

---

## 4. Target design — sessions, refresh & cross-tab

### 4.1 Server
1. **`Session` collection** (replace `User.refreshTokens[]`): `{ _id(sid), user, familyId, tokenHash(sha256), prevTokenHash, prevValidUntil, userAgent, ip, createdAt, lastUsedAt, expiresAt, absoluteExpiresAt, revokedAt }`; TTL index on `expiresAt`.
2. **Opaque refresh token** (`crypto.randomBytes(48)`, only the hash stored) — or JWT with `sid`+`jti` — delivered via `HttpOnly; Secure; Path=/api/auth` cookie.
3. **Rotation with grace window:** on `/refresh` issue a new token, keep the previous hash valid for ~30 s (`prevValidUntil`) so concurrent tabs/retries succeed and receive the *same* newest session. Presenting a token **older than the grace window** ⇒ treat as theft ⇒ revoke the whole family.
4. **Lifetimes:** access 15 min; refresh **30 days sliding idle**, **90 days absolute** (`REFRESH_IDLE_DAYS`, `REFRESH_ABSOLUTE_DAYS` env); optional "remember me" shortens to session cookie. Satisfies "logged in > 10 days".
5. No per-user cap of 5; cap by *sessions* (e.g. 20) with oldest-idle eviction and a visible Sessions list + `POST /auth/logout-all`.
6. `refresh` checks `isActive`; password reset/change revokes all sessions; deactivation revokes all.
7. Rate limits: `/refresh` (per IP + per session), `/login` per account+IP with backoff.
8. Fix **A1** (CORS allow-list + CSRF Origin check on state-changing routes) in the same PR.

### 4.2 Client
1. **Single-flight refresh across tabs** using `navigator.locks.request("lyzov-refresh", …)` (fallback: `localStorage` mutex); after acquiring the lock re-check whether another tab already refreshed.
2. **`BroadcastChannel("lyzov-auth")`** (fallback `storage` event) messages: `LOGIN`, `LOGOUT`, `TOKEN_REFRESHED {accessToken, exp}`, `CART_CHANGED`, `USER_UPDATED`. Receivers update Redux + in-memory token; `LOGOUT` clears state and routes protected pages to `/login`.
3. Fix **A5**: on refresh failure reject *all* queued requests and clear the queue; add `refreshPromise` (single shared promise) instead of the subscriber array.
4. **Proactive refresh:** schedule at `exp − 60 s` (jittered) and on `visibilitychange`/`online`/`focus` after being hidden; this removes most 401-then-retry traffic.
5. Cart/wishlist/profile sync across tabs via the channel (+ refetch on focus).
6. Keep access token in memory only (never `localStorage`); bootstrap via `/auth/refresh` → `/auth/me` on load.

---

## 5. Razorpay migration (replace Stripe)

`razorpay` ^2.9.8 is **already in** `backend/server/package.json` but unused — Stripe is wired in `config/stripe.js`, `orderController` (intent, refunds), `CheckoutPage.jsx`, `StripePaymentForm.jsx`, and CSP in `app.js`.

### 5.1 Principles (these close P1–P5)
- Server decides the amount; Razorpay **Order is bound to our Order**; verification is server-side only; every payment id is single-use; webhook reconciles; live/test is enforced by key prefix.

### 5.2 New data model
- `Order.paymentMethod` enum: `["razorpay","cod"]` (Stripe **removed completely** — decision confirmed). Existing orders with `paymentMethod:"stripe"` are handled by a one-off migration script (see §5.10) so the enum change does not break reads or validation.
- `Order.paymentStatus`: `created | awaiting_payment | authorized | captured | failed | refund_pending | refunded | partially_refunded | cod_pending`.
- `Order.payment`: `{ provider, razorpayOrderId, razorpayPaymentId, signature, method, amount (paise), currency, capturedAt, failureReason, refunds:[{id, amount, status, createdAt}] }`.
- **Unique sparse indexes** on `payment.razorpayOrderId` and `payment.razorpayPaymentId`.
- `orderStatus` gains `awaiting_payment` (never visible to seller fulfilment queues).
- `PaymentEvent` collection `{ eventId unique, type, payload, processedAt }` for webhook idempotency.
- `StockReservation` `{ order, items, expiresAt }` (TTL) *or* reserve by decrementing stock at order creation and restoring on expiry/failure.

### 5.3 Endpoints
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/payments/razorpay/order` | protect + profile complete. Re-price cart from DB, validate stock/coupon, create `Order(awaiting_payment)` + reservation, `razorpay.orders.create({amount: paise, currency:"INR", receipt: orderNumber, notes:{orderId,userId}})`, return `{keyId, razorpayOrderId, amount, currency, orderId, prefill}`. Idempotent: reuse the open Razorpay order for the same unchanged cart. |
| POST | `/api/payments/razorpay/verify` | Verify `HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, KEY_SECRET)` with `timingSafeEqual`; load order by `razorpayOrderId`, assert owner; `razorpay.payments.fetch()` and assert `status ∈ {captured, authorized→capture}`, `amount === order.totalPrice*100`, `currency`, `order_id` match; atomic `awaiting_payment → processing` guard; store payment id (unique); clear cart; fire emails. |
| POST | `/api/payments/razorpay/webhook` | **Raw body**; verify `X-Razorpay-Signature` with `RAZORPAY_WEBHOOK_SECRET`; dedupe on `X-Razorpay-Event-Id`; handle `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`, `refund.failed`. Same finalize routine as `/verify` (idempotent) so closed-tab payments still complete. |
| GET | `/api/orders/:id/payment-status` | Polling for the "payment pending" screen. |
| POST | refunds (internal) | `razorpay.payments.refund(paymentId,{amount, speed:"normal", notes})`, idempotent per order/return; status finalised by webhook. |

### 5.4 Config & guards
`config/razorpay.js`: instantiate `new Razorpay({key_id, key_secret})`; **refuse boot / disable online payments** if `NODE_ENV=production` and key id does not start with `rzp_live_` (and vice-versa in dev). Env: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. No feature flag and no provider switch — Razorpay is the only online gateway. No publishable key in the frontend `.env` — server returns `keyId`.

### 5.5 Frontend
- `useRazorpay` hook: lazy-load `https://checkout.razorpay.com/v1/checkout.js`; `RazorpayButton` replaces `StripePaymentForm`/`<Elements>` in [CheckoutPage.jsx](frontend/client/src/pages/CheckoutPage.jsx).
- Flow: call `/payments/razorpay/order` → open modal (`order_id`, `prefill`, theme from design tokens) → on `handler` call `/verify` → navigate to order; handle `modal.ondismiss` (keep order `awaiting_payment`, allow retry), `payment.failed` event, and a **"verifying payment…"** state that polls `/payment-status` (covers slow webhook).
- Stop sending `items/subtotal/total/discount…` from the client in `createOrder` calls (server ignores them today; remove to avoid false trust).
- Remove `@stripe/stripe-js`, `@stripe/react-stripe-js`, `VITE_STRIPE_PUBLISHABLE_KEY` after cut-over.

### 5.6 Cart freeze
When `/payments/razorpay/order` succeeds, cart mutation endpoints reject/refresh with a clear message (or the cart is cloned into the order snapshot and the cart emptied only on success), eliminating the P2 window.

### 5.7 Expiry/cleanup
Awaiting-payment orders expire (e.g. 20 min): release stock, mark `cancelled/payment_expired`. Implement as a Vercel Cron (`/api/cron/expire-orders`, secret-protected) and a lazy sweep on read.

### 5.8 CSP additions (`app.js` helmet, prod)
`script-src` + `https://checkout.razorpay.com`; `frame-src` + `https://api.razorpay.com https://checkout.razorpay.com`; `connect-src` + `https://api.razorpay.com https://lumberjack.razorpay.com`; `img-src` + `https://*.razorpay.com`. Remove Stripe hosts after cut-over.

### 5.9 Hosting risk — raw body on Vercel (decision needed)
Signature verification needs the **exact raw bytes**. The API runs as a Vercel serverless function via `api/index.js`; Vercel's Node helpers may pre-parse `req.body`. Mitigation: export `config = { api: { bodyParser: false } }` from `api/index.js`, mount `express.raw({type:"application/json"})` on the webhook path *before* `express.json()`, and add a startup/CI test with a captured Razorpay payload. If this proves unreliable, host the API (or just the webhook) on a long-lived Node host.

### 5.10 Rollout (Stripe removed completely)
1. Build Razorpay end-to-end in **test mode** on this branch; QA with Razorpay test cards/UPI (`success@razorpay`, `failure@razorpay`) and the webhook via a tunnel.
2. **Delete Stripe in the same release**: `config/stripe.js`, `createPaymentIntent`, Stripe refund calls in `cancelOrder`/`adminCancelOrder`, the `stripe` npm dep, `@stripe/*` frontend deps, `StripePaymentForm.jsx`, `VITE_STRIPE_PUBLISHABLE_KEY`, Stripe CSP hosts, and the Stripe mock in `tests/test_cancel_exchange_flow.js`.
3. **Legacy orders:** before deploy, run `scripts/audit-stripe-orders.js` to list orders with `paymentMethod:"stripe"` that are paid and still refundable/cancellable. Either (a) refund/close them from the Stripe dashboard first, or (b) migrate them to `paymentMethod:"legacy_stripe"` (read-only, refunds handled manually). Cancelling such an order after cut-over must show "refund manually" instead of calling an API that no longer exists.
4. Switch to live Razorpay keys + live webhook; rotate/revoke the Stripe keys afterwards.

---

## 6. Implementation plan (PR sequence)

| Phase | PR | Contents | Depends on |
|---|---|---|---|
| **0** | `audit-remaining` | Finish §7 checklist; write exploit regression tests (fail on `main`) | — |
| **1** | `hotfix-payment-integrity` (ship ASAP, Stripe still live) | P1 replay guard (unique idx + claim), P2 amount/currency/binding check, P3 livemode guard, P4 strict owner, P5 refund-on-failure, P7 coupon fixes, P8 atomic cancel/refund order, P9 status route cleanup, P12 webhook auth, P13 tracking fix, **A1 CORS allow-list** | Phase 0 tests |
| **2** | `order-integrity` | Order-before-payment model, cart freeze, DB re-pricing, stock reservation/expiry, COD limits | 1 |
| **3** | `auth-sessions` | `Session` model, grace-window rotation, reuse detection, 30d idle / 90d absolute, sessions list + logout-all, limiter, cookie symmetry, remove plaintext temp password | 1 |
| **4** | `client-auth-crosstab` | Single-flight refresh + Web Locks, BroadcastChannel sync, proactive refresh, A5 fix, cart/user sync | 3 |
| **5** | `razorpay` | §5 end-to-end, **Stripe removed completely** (backend, frontend, deps, CSP, tests), legacy-order migration, webhook, refunds, cron | 1, 2 |
| **6** | `cutover-cleanup` | Live keys, revoke Stripe keys, docs/runbook, monitoring/alerts | 5 |

Each PR: tests green, CHANGELOG entry, env vars documented, rollback = revert + flag.

### Acceptance tests (must exist before merge)
- **Replay:** same payment id twice ⇒ second order rejected (409).
- **Amount:** pay for cart A, mutate cart (qty ↑/↓, add item), place order ⇒ rejected / frozen.
- **Livemode:** test-mode payment in production config ⇒ rejected; boot guard trips on wrong key prefix.
- **Ownership:** payment with missing/foreign metadata/notes ⇒ rejected.
- **Failure path:** out-of-stock after pay ⇒ auto-refund + clear message; no stock drift.
- **Coupon:** parallel redemption of single-use coupon ⇒ exactly one succeeds; max-discount and >100% capped.
- **Cancel race:** 20 parallel cancels ⇒ stock restored once, ≤ 1 refund.
- **Webhook:** bad/missing signature ⇒ 401; duplicate event id ⇒ no-op; out-of-order events safe; Delhivery webhook without secret ⇒ 401.
- **Tracking:** 1-digit phone ⇒ rejected; rate-limit trips; response omits phone.
- **Sessions:** two tabs refreshing simultaneously ⇒ both succeed; reuse after grace ⇒ family revoked; idle 29d ⇒ still valid; idle 31d ⇒ expired; password change ⇒ all sessions revoked.
- **Cross-tab:** logout in tab A ⇒ tab B redirected within 1 s; login in A ⇒ B hydrates; refresh in A ⇒ B reuses token without a network call.
- **CORS:** disallowed `Origin` with credentials ⇒ no `Access-Control-Allow-Origin`.

---

## 7. Phase 0 — remaining audit checklist
- [ ] `productController` / `categoryController` / `brandController`: mass-assignment, price/stock validation, slug injection
- [ ] `reviewController`: verified-purchase enforcement, XSS/stored content, rating abuse
- [ ] `userController`: role escalation via `updateUser`/profile, seller KYC encryption (`utils/encryption`), PII exposure in `getUsers`
- [ ] `uploadMiddleware` + `uploadRoutes`: MIME/size/extension validation, folder traversal via `req.body.folder`
- [ ] `prerenderService`/`sitemapController`: HTML injection into prerendered pages from product fields
- [ ] `emailService`/support/contact: header injection, rate limits, open relay
- [ ] `adminAnalytics`: authorisation scope (`/api/seller` is mounted to the *admin* router — [app.js:116-117](backend/server/app.js))
- [ ] `shippingController` `estimate/track` public endpoints: abuse/cost (Delhivery quota)
- [ ] Frontend: `dangerouslySetInnerHTML`, open redirects (`redirectTo`), token/PII in logs, Vercel `vercel.json` headers
- [ ] Dependency audit (`npm audit`), `xss-clean` (deprecated) replacement, secrets in repo (`frontend/client/.env`, `backend/server/.env` tracked?)

---

## 8. Decisions needed from you
1. **Razorpay account:** test keys available now? Which payment methods to enable (UPI/cards/netbanking/wallets/EMI)?
2. ~~Stripe: hard cut-over or keep for legacy?~~ **Decided: remove Stripe completely, integrate Razorpay.** Remaining question: how to treat existing paid Stripe orders (refund from dashboard vs. mark `legacy_stripe` and refund manually) — §5.10 step 3.
3. **Session policy:** confirm 30 d idle / 90 d absolute, and whether to offer "Remember me".
4. **Hosting:** keep API on Vercel functions (needs the raw-body workaround in §5.9) or move the API/webhook to a long-lived host?
5. **COD:** keep? If yes, max order value and daily limit per user, and OTP verification.
6. **Hotfix first?** Phase 1 patches the Stripe flow, which is being deleted. Since Stripe goes away, either (a) ship only the provider-independent parts of Phase 1 now (CORS, webhook auth, tracking, coupon, cancel races) and put the payment checks directly into the Razorpay build, or (b) as an emergency stop-gap until Razorpay is live, disable Stripe checkout (COD only) because the replay/amount bypass is live today. Recommended: (b) + (a).
