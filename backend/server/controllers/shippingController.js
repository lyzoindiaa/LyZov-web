const delhiveryService = require('../services/delhiveryService');
const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
const Notification = require('../models/Notification');

exports.checkPincode = async (req, res) => {
  try {
    const { pincode } = req.params;
    const result = await delhiveryService.checkPincodeServiceability(pincode);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check pincode serviceability', error: error.message });
  }
};

exports.estimateRates = async (req, res) => {
  try {
    const params = req.body;
    // Expected params: cl, ss, md, pt, d_pin, o_pin, cgm
    const result = await delhiveryService.estimateShippingRates(params);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to estimate rates', error: error.message });
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
    const codAmount = order.paymentMethod === 'cod' ? order.totalPrice : 0;

    const delhiveryPayload = {
      order: order.orderNumber,
      name: order.shippingAddress.fullName,
      add: `${order.shippingAddress.addressLine1} ${order.shippingAddress.addressLine2 || ''}`.trim(),
      pin: order.shippingAddress.postalCode,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      country: order.shippingAddress.country || 'India',
      phone: order.shippingAddress.phone,
      payment_mode: paymentMode,
      total_amount: order.totalPrice,
      cod_amount: codAmount,
      products_desc: order.items.map((i) => i.name).join(', '),
      hsn_code: req.body.hsn_code || '6203',
      seller_gst_tin: req.body.seller_gst_tin || process.env.DELHIVERY_GST_TIN || '27ABCDE1234F1Z5',
      pickup_location: {
        name: pickupWarehouse,
      },
    };

    let result = null;
    let waybill = null;

    try {
      result = await delhiveryService.createOrder(delhiveryPayload);
      if (result?.packages && result.packages.length > 0) {
        waybill = result.packages[0].waybill;
      }
    } catch (delhiveryErr) {
      console.error('[Delhivery] Create order error:', delhiveryErr.response?.data || delhiveryErr.message);
      if (process.env.NODE_ENV !== 'production' || !process.env.DELHIVERY_API_TOKEN) {
        waybill = `DLV-${Date.now()}`;
      } else {
        return res.status(500).json({
          success: false,
          message: 'Delhivery manifestation failed: ' + (delhiveryErr.response?.data?.message || delhiveryErr.message),
        });
      }
    }

    if (!waybill) {
      waybill = `DLV-${Date.now()}`;
    }

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
    const result = await delhiveryService.getPackingSlip(waybill);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch packing slip: ' + (error.response?.data?.message || error.message),
    });
  }
};

exports.createPickupRequest = async (req, res) => {
  try {
    const params = req.body;
    const result = await delhiveryService.createPickupRequest(params);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create pickup request: ' + (error.response?.data?.message || error.message),
    });
  }
};

exports.createReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderData = req.body;
    
    const result = await delhiveryService.createReversePickup(orderData);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create return', error: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { waybill } = req.params;
    const result = await delhiveryService.cancelOrder(waybill);
    
    // Update shipment status in DB
    await Shipment.findOneAndUpdate({ waybillNumber: waybill }, { status: 'Cancelled' });
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel order', error: error.message });
  }
};

exports.trackOrder = async (req, res) => {
  try {
    const { waybill } = req.params;
    const result = await delhiveryService.trackOrder(waybill);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to track order', error: error.message });
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
