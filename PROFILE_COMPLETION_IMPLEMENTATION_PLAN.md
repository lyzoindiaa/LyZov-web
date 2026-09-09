# Profile Completion Implementation Plan

## Overview
When users sign up via Google, they currently provide only: **name, email, avatar**. We need to enforce profile completion (phone number + address) before they can place orders.

---

## Current State Analysis

### Data from Google OAuth
```
✓ name: "John Doe" (from Google profile)
✓ email: "john@gmail.com" (verified by Google)
✓ avatar: "https://..." (Google's hosted image)
✗ phone: "" (MISSING)
✗ address: {} (MISSING)
```

### Risk Without Profile Completion
1. User signs up via Google → auto-redirected to dashboard
2. User tries to checkout without adding phone/address
3. Checkout validation fails with cryptic error
4. Poor UX: user has to figure out they need to go to profile page
5. **Abandoned checkouts increase**

---

## Solution Architecture

### 1. Add `profileComplete` Flag to User Model
**File:** `backend/server/models/User.js`

```javascript
profileComplete: {
  type: Boolean,
  default: false,
  // true when user has added:
  // - phone number (required)
  // - at least one address (required for checkout)
}
```

### 2. Update Google Signup Flow
**File:** `backend/server/controllers/authController.js`

**Current Behavior:**
- Google user created → auto-redirected to `/dashboard`

**New Behavior:**
- Google user created with `profileComplete: false`
- Redirects to `/complete-profile` instead
- After phone + address added → redirects to `/dashboard`

**Code Change:**
```javascript
// In googleCallback, after user creation:
if (!existingUser) {
  user = new User({
    // ... existing fields
    profileComplete: false  // ADD THIS
  });
  await user.save();
  // ...
}

// When redirecting:
if (!user.profileComplete) {
  return res.redirect(`${getFrontendUrl()}/complete-profile`);
}
return res.redirect(`${getFrontendUrl()}/dashboard`);
```

### 3. Create Middleware: `requireProfileComplete`
**File:** `backend/server/middleware/profileMiddleware.js`

```javascript
const requireProfileComplete = asyncHandler(async (req, res, next) => {
  if (!req.user.profileComplete) {
    throw ApiError.forbidden(
      "Please complete your profile (phone & address) before placing orders"
    );
  }
  next();
});

module.exports = { requireProfileComplete };
```

**Apply to:**
- `POST /api/orders/create` 
- `POST /api/orders/checkout`
- Any order-related endpoints

### 4. Create Frontend: Complete Profile Page
**File:** `frontend/client/src/pages/CompleteProfilePage.jsx`

**Features:**
- Phone input (required, Indian mobile validation)
- Address form (required)
- Save button
- Only accessible to users with `profileComplete: false`
- Auto-redirect if `profileComplete: true`

**Flow:**
```
Google signup → /complete-profile → add phone + address → save
→ Backend sets profileComplete: true → frontend redirects to /dashboard
```

### 5. Update Backend: Profile Update Endpoint
**File:** `backend/server/controllers/userController.js`

**New Logic:**
```javascript
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;
  
  // Update existing fields
  if (phone) {
    req.user.phone = phone;
    req.user.isPhoneVerified = true;
  }
  
  // Check if profile is now complete
  if (req.user.phone && req.user.addresses?.length > 0) {
    req.user.profileComplete = true;
  }
  
  await req.user.save();
  // ...
});
```

### 6. Add Address Creation Handler
**Ensure when address is created, profile gets marked complete:**

**File:** `backend/server/controllers/addressController.js`

```javascript
const createAddress = asyncHandler(async (req, res) => {
  const address = new Address({
    user: req.user._id,
    // ... address fields
  });
  await address.save();
  
  // Mark profile as complete if user has phone
  if (req.user.phone) {
    req.user.profileComplete = true;
    await req.user.save();
  }
  
  // ...
});
```

### 7. Frontend: Complete Profile Page Component
**File:** `frontend/client/src/pages/CompleteProfilePage.jsx`

**Key Features:**
```javascript
- Phone input with Indian validation: /^[6-9]\d{9}$/
- Address form (copy from AddressPage)
- Progress indicator (Step 1: Phone, Step 2: Address)
- Skip option? (Optional - recommend not skipping)
- Auto-redirect if profileComplete = true
- Error handling & loading states
```

### 8. Enable Email/Password Authentication
**File:** `frontend/client/src/pages/LoginPage.jsx` & `RegisterPage.jsx`

Uncomment the previously commented email/password forms and integrate them with existing email/password routes.

---

## Implementation Priority

### Phase 1: Profile Completion (Required)
1. ✅ Add `profileComplete` flag to User model
2. ✅ Update Google callback to redirect to `/complete-profile`
3. ✅ Create `CompleteProfilePage` component
4. ✅ Add `requireProfileComplete` middleware
5. ✅ Apply middleware to order routes
6. ✅ Update profile update endpoints

### Phase 2: Email/Password Auth (Optional Enhancement)
1. ✅ Uncomment LoginPage email/password form
2. ✅ Uncomment RegisterPage email/password form
3. ✅ Ensure generic error messages (not "password not set")

---

## Data Flow Diagram

```
┌─────────────────┐
│  Google Login   │
└────────┬────────┘
         ↓
    ┌────────────────────────┐
    │ Check if User Exists?  │
    └───┬──────────────┬──────┘
        │ (Yes)        │ (No)
        ↓              ↓
   ┌─────────────┐  ┌──────────────────────┐
   │ Existing    │  │ Create New User      │
   │ User        │  │ profileComplete=false│
   └──────┬──────┘  └──────────┬───────────┘
          │                    │
          └────────┬───────────┘
                   ↓
        ┌──────────────────────┐
        │ Check isActive?      │
        └──┬──────────────┬────┘
           │ (Yes)        │ (No - deactivated)
           ↓              ↓
      ┌─────────────────────────────────────┐
      │ Check profileComplete?              │
      └──┬─────────────────────────────────┬─┘
         │ (false)                │ (true)
         ↓                        ↓
    ┌──────────────────┐    ┌──────────────┐
    │ Redirect to      │    │ Redirect to  │
    │ /complete-profile│    │ /dashboard   │
    └──────────────────┘    └──────────────┘
         ↓
    ┌──────────────────────────────┐
    │ Complete Profile Page        │
    │ - Enter Phone Number         │
    │ - Add Address (Auto-save)    │
    └───────────────┬──────────────┘
                    ↓
        ┌───────────────────────────┐
        │ Update User Profile       │
        │ Set profileComplete=true  │
        └──────────┬────────────────┘
                   ↓
        ┌──────────────────────┐
        │ Redirect to Dashboard│
        └──────────────────────┘
```

---

## Critical Fields by Use Case

| Use Case | Required Fields | Validated At |
|----------|-----------------|--------------|
| **Signup (Google)** | email, name | Google OAuth |
| **Complete Profile** | phone, address | ProfilePage |
| **Place Order** | email, phone, name, address | Checkout + Backend |
| **Delivery** | phone, address | Order fulfillment |

---

## Risk Mitigation

### What if user closes browser during profile completion?
- **Solution:** No data lost. When they return, they'll redirect to `/complete-profile` again

### What if user has multiple addresses?
- **Solution:** `profileComplete` only requires at least one address (default for checkout)

### What if user already has a phone but not addresses?
- **Solution:** Still `profileComplete=false`. Must add address to complete

### What about local (email/password) signup users?
- **Solution:** Set `profileComplete=true` only after phone + address added (same flow)

---

## Security Notes

⚠️ **Important:** Don't expose "password not set" errors
- Current: Returns "Invalid email or password"
- Good: Keeps users with only Google auth hidden
- Ensures users can't determine signup method of others

---

## Testing Checklist

- [ ] Google signup redirects to `/complete-profile`
- [ ] Phone validation works (Indian format)
- [ ] Address can be added/updated
- [ ] After saving, redirects to `/dashboard`
- [ ] `profileComplete=true` prevents redirect
- [ ] Attempting checkout without `profileComplete=true` fails
- [ ] Email/password forms work if enabled
- [ ] No "password not set" errors leak to users

---

## Files to Modify/Create

### Backend
1. **Modify:** `models/User.js` (add profileComplete flag)
2. **Modify:** `controllers/authController.js` (update googleCallback)
3. **Create:** `middleware/profileMiddleware.js` (new middleware)
4. **Modify:** `controllers/userController.js` (profile update logic)
5. **Modify:** `controllers/addressController.js` (auto-mark complete)
6. **Modify:** `routes/orderRoutes.js` (add middleware to checkout)

### Frontend
1. **Create:** `pages/CompleteProfilePage.jsx` (new page)
2. **Modify:** `pages/LoginPage.jsx` (uncomment email/password)
3. **Modify:** `pages/RegisterPage.jsx` (uncomment email/password)
4. **Modify:** `utils/ProtectedRoute.jsx` (handle redirects)
5. **Modify:** `features/auth/authSlice.js` (if needed)

---

## Estimated Timeline
- **Backend Setup:** 30 mins
- **Frontend Complete Profile Page:** 45 mins
- **Testing & Refinement:** 45 mins
- **Total:** ~2 hours

