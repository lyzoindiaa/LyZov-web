const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
  },
  vendor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // In LyZov, vendors are users with role 'vendor' or similar, but the ref might be 'User' or 'Vendor'. I'll assume 'User'.
    required: true 
  },
  pickupWarehouseName: { 
    type: String, 
    required: true 
  },
  waybillNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  paymentMode: { 
    type: String, 
    enum: ['Prepaid', 'COD', 'Pickup'] 
  },
  status: {
    type: String,
    enum: ['Manifested', 'In Transit', 'Pending', 'Open', 'Scheduled', 'Picked Up', 'Delivered', 'RTO', 'Returned', 'Cancelled'],
    default: 'Manifested'
  },
  pickupRequestId: { 
    type: String 
  },
  labelUrl: { 
    type: String 
  },
  isTest: { 
    type: Boolean, 
    default: true 
  },
  courier: { 
    type: String, 
    default: 'delhivery' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Shipment', shipmentSchema);
