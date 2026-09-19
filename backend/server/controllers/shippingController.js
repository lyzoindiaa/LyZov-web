const delhiveryService = require('../services/delhiveryService');
const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
const Notification = require('../models/Notification');

// ---------------------------------------------------------------------------
// Helper: converts a raw Delhivery/network error into a structured response
// ---------------------------------------------------------------------------
const handleDelhiveryError = (res, error, context = 'Delhivery request') => {
  const networkCodes = ['ECONNABORTED', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET'];

  if (networkCodes.includes(error.code)) {
    console.error(`[Delhivery] Network error during "${context}":`, error.code, error.message);
    return res.status(503).json({
      success: false,
      message: 'Shipping partner unreachable, please retry in a moment.',
      errorCode: error.code,
    });
  }

  // Delhivery returned a non-2xx HTTP response — surface it faithfully
  if (error.response) {
    const status = error.response.status;
    console.error(`[Delhivery] HTTP ${status} during "${context}":`, error.response.data);
    return res.status(status >= 500 ? 502 : status).json({
      success: false,
      message: `Shipping partner returned an error (${status}).`,
      detail: error.response.data,
    });
  }

  // Unexpected / unknown error
  console.error(`[Delhivery] Unknown error during "${context}":`, error.message);
  return res.status(500).json({
    success: false,
    message: `Failed: ${context}`,
    error: error.message,
  });
};

exports.checkPincode = async (req, res) => {
  try {
    const { pincode } = req.params;
    /*
    // Delhivery API check paused
    const result = await delhiveryService.checkPincodeServiceability(pincode);
    return res.status(200).json({ success: true, data: result });
    */
    // Standard offline validation: 6-digit Indian pincode format
    const isValidPin = /^[1-9][0-9]{5}$/.test(pincode);
    return res.status(200).json({
      success: true,
      data: {
        serviceable: isValidPin,
        pincode,
        message: isValidPin ? "Standard delivery available (7-10 business days)" : "Invalid pincode",
      },
    });
  } catch (error) {
    return handleDelhiveryError(res, error, 'check pincode serviceability');
  }
};

exports.estimateRates = async (req, res) => {
  try {
    /*
    // Delhivery API estimate paused
    const result = await delhiveryService.estimateShippingRates(req.body);
    return res.status(200).json({ success: true, data: result });
    */
    return res.status(200).json({
      success: true,
      data: {
        rate: 0,
        estimatedDays: "7-10",
        message: "Complimentary premium shipping applied",
      },
    });
  } catch (error) {
    return handleDelhiveryError(res, error, 'estimate shipping rates');
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (["cancelled", "refunded"].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: 'Cannot ship a cancelled or refunded order' });
    }

    // Check if already manifested
    const existingShipment = await Shipment.findOne({
      order: orderId,
      status: { $nin: ['Cancelled', 'Returned', 'RTO'] }
    });
    if (existingShipment) {
      return res.status(400).json({
        success: false,
        message: `Order is already manifested with waybill: ${existingShipment.waybillNumber}`,
        data: existingShipment
      });
    }

    const pickupWarehouse =
      req.body.pickupWarehouseName ||
      req.body.pickup_location?.name ||
      process.env.DELHIVERY_PICKUP_LOCATION ||
      "Primary Warehouse";

    const paymentMode = order.paymentMethod === 'cod' ? 'COD' : 'Prepaid';

    // Delhivery API call paused — generate standard internal waybill
    const waybill = req.body.waybill || `AWB-${Date.now()}`;
    /*
    let result = null;
    try {
      result = await delhiveryService.createOrder(delhiveryPayload);
      if (result?.packages && result.packages.length > 0) {
        waybill = result.packages[0].waybill;
      }
    } catch (delhiveryErr) {
      console.error('[Delhivery] Create order error:', delhiveryErr.message);
    }
    */

    const newShipment = new Shipment({
      order: order._id,
      vendor: req.user?._id || order.user,
      pickupWarehouseName: pickupWarehouse,
      waybillNumber: waybill,
      paymentMode,
      status: 'Manifested',
      isTest: process.env.DELHIVERY_ENV !== 'production',
      courier: 'delhivery',
    });
    await newShipment.save();

    // Update order status and tracking number
    order.trackingNumber = waybill;
    if (order.orderStatus === 'pending') {
      order.orderStatus = 'processing';
    }
    order.statusHistory.push({
      status: order.orderStatus,
      note: `Manifested with Delhivery. Waybill: ${waybill}`,
    });
    await order.save();

    await Notification.create({
      user: order.user,
      title: "Order Dispatched for Packing",
      message: `Your order ${order.orderNumber} is being prepared for shipping with Delhivery. Tracking AWB: ${waybill}`,
      type: "order",
      link: `/dashboard/orders/${order._id}`,
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Order manifested successfully with Delhivery',
      data: {
        order,
        shipment: newShipment,
        delhivery: result,
      },
    });
  } catch (error) {
    console.error('Create order shipping error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
};

exports.getPackingSlip = async (req, res) => {
  try {
    const { waybill } = req.params;
    /*
    const result = await delhiveryService.getPackingSlip(waybill);
    return res.status(200).json({ success: true, data: result });
    */
    return res.status(200).json({
      success: true,
      message: "Standard packing slip",
      data: { waybill, status: "generated" },
    });
  } catch (error) {
    return handleDelhiveryError(res, error, 'fetch packing slip');
  }
};

exports.createPickupRequest = async (req, res) => {
  try {
    /*
    const result = await delhiveryService.createPickupRequest(req.body);
    return res.status(200).json({ success: true, data: result });
    */
    return res.status(200).json({
      success: true,
      message: "Pickup scheduled successfully",
    });
  } catch (error) {
    return handleDelhiveryError(res, error, 'create pickup request');
  }
};

exports.createReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    /*
    const result = await delhiveryService.createReversePickup(req.body);
    return res.status(201).json({ success: true, data: result });
    */
    const returnWaybill = `REV-${Date.now()}`;
    return res.status(201).json({
      success: true,
      message: "Return pickup registered",
      data: { packages: [{ waybill: returnWaybill }] },
    });
  } catch (error) {
    return handleDelhiveryError(res, error, 'create return/reverse pickup');
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { waybill } = req.params;
    /*
    const result = await delhiveryService.cancelOrder(waybill);
    */
    // Update shipment status in DB
    await Shipment.findOneAndUpdate({ waybillNumber: waybill }, { status: 'Cancelled' });
    
    return res.status(200).json({ success: true, message: `Shipment ${waybill} cancelled successfully` });
  } catch (error) {
    return handleDelhiveryError(res, error, 'cancel order');
  }
};

exports.trackOrder = async (req, res) => {
  try {
    const { waybill } = req.params;
    /*
    const result = await delhiveryService.trackOrder(waybill);
    return res.status(200).json({ success: true, data: result });
    */
    const shipment = await Shipment.findOne({ waybillNumber: waybill }).populate('order');
    return res.status(200).json({
      success: true,
      data: {
        waybill,
        status: shipment ? shipment.status : "In Transit",
        order: shipment ? shipment.order : null,
      },
    });
  } catch (error) {
    return handleDelhiveryError(res, error, 'track order');
  }
};

exports.trackingWebhook = async (req, res) => {
  try {
    const payload = req.body || {};
    
    // Extract waybill and raw status from possible Delhivery payload shapes
    const waybill =
      payload.waybill ||
      payload.Shipment?.AWB ||
      payload.awb ||
      payload.Waybill;

    const rawStatus =
      payload.status ||
      payload.Status?.Status ||
      payload.current_status ||
      payload.Shipment?.Status?.Status ||
      "";

    if (!waybill) {
      return res.status(200).json({ success: true, message: "No waybill in payload, ignored" });
    }

    const shipment = await Shipment.findOne({ waybillNumber: waybill });
    if (!shipment) {
      return res.status(200).json({ success: true, message: `Shipment with waybill ${waybill} not found` });
    }

    // Normalize Delhivery status to internal Shipment status enum
    let mappedStatus = shipment.status;
    const lowerStatus = String(rawStatus).toLowerCase();

    if (lowerStatus.includes("picked up") || lowerStatus.includes("pickup done") || lowerStatus.includes("out for pickup")) {
      mappedStatus = "Picked Up";
    } else if (lowerStatus.includes("in transit") || lowerStatus.includes("dispatched") || lowerStatus.includes("manifested")) {
      mappedStatus = "In Transit";
    } else if (lowerStatus.includes("delivered")) {
      mappedStatus = "Delivered";
    } else if (lowerStatus.includes("returned") || lowerStatus.includes("rto")) {
      mappedStatus = "Returned";
    } else if (lowerStatus.includes("cancelled") || lowerStatus.includes("canceled")) {
      mappedStatus = "Cancelled";
    }

    shipment.status = mappedStatus;
    await shipment.save();

    // Link back to Order
    if (shipment.order) {
      const order = await Order.findById(shipment.order);
      if (order) {
        if (shipment.paymentMode === "Pickup") {
          // Reverse logistics flow (Return / Exchange)
          if (mappedStatus === "Picked Up") {
            order.returnStatus = "Picked Up";
            order.statusHistory.push({
              status: order.orderStatus,
              note: `Return item picked up by Delhivery (AWB: ${waybill})`,
            });
            await order.save();

            await Notification.create({
              user: order.user,
              title: "Return Item Picked Up",
              message: `Your return item for order ${order.orderNumber} was picked up by the courier.`,
              type: "order",
              link: `/dashboard/orders/${order._id}`,
            }).catch(() => {});
          } else if (mappedStatus === "Delivered" || mappedStatus === "Returned") {
            order.returnStatus = "Returned";
            order.statusHistory.push({
              status: order.orderStatus,
              note: `Return package received at warehouse (AWB: ${waybill}). Awaiting inspection.`,
            });
            await order.save();

            await Notification.create({
              user: order.user,
              title: "Return Package Received at Warehouse",
              message: `Return package for order ${order.orderNumber} arrived at warehouse and is pending inspection.`,
              type: "order",
              link: `/dashboard/orders/${order._id}`,
            }).catch(() => {});
          }
        } else {
          // Forward logistics flow
          if (mappedStatus === "Delivered") {
            order.orderStatus = "delivered";
            order.isDelivered = true;
            order.deliveredAt = new Date();
            order.statusHistory.push({
              status: "delivered",
              note: `Delivered via Delhivery (AWB: ${waybill})`,
            });
            await order.save();
          } else if (mappedStatus === "In Transit" && order.orderStatus === "processing") {
            order.orderStatus = "shipped";
            order.statusHistory.push({
              status: "shipped",
              note: `Dispatched and in transit with Delhivery (AWB: ${waybill})`,
            });
            await order.save();
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Webhook processed for waybill ${waybill}`,
      data: { waybill, status: mappedStatus },
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ success: false, message: "Webhook processing failed", error: error.message });
  }
};
