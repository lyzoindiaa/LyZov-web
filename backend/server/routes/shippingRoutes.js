const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Phase 2: Pincode Serviceability (Public)
router.get('/pincode/:pincode', shippingController.checkPincode);

// Phase 3: Rate Estimation (Public or Auth)
router.post('/estimate', shippingController.estimateRates);

// Phase 5: Order Creation & Returns (Seller/Admin protected)
router.post('/order/:orderId', protect, authorize('seller'), shippingController.createOrder);
router.post('/return/:orderId', protect, authorize('seller'), shippingController.createReturn);

// Phase 6: Cancel Order (Seller/Admin protected)
router.post('/cancel/:waybill', protect, authorize('seller'), shippingController.cancelOrder);

// Shipping Label / Packing Slip (Seller/Admin protected)
router.get('/label/:waybill', protect, authorize('seller'), shippingController.getPackingSlip);

// Pickup Request (Seller/Admin protected)
router.post('/pickup-request', protect, authorize('seller'), shippingController.createPickupRequest);

// Phase 7: Order Tracking (Public or Auth)
router.get('/track/:waybill', shippingController.trackOrder);

// Phase 8: Webhook for tracking updates (Public, triggered by Delhivery)
router.post('/webhook', shippingController.trackingWebhook);

module.exports = router;
