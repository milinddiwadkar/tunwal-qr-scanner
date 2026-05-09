const mongoose = require('mongoose');

const scanLogSchema = new mongoose.Schema(
  {
    qrId: { type: String, required: true, index: true },
    scanType: {
      type: String,
      enum: ['activation', 'emergency'],
      required: true
    },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    ipAddress: { type: String, default: '' },
    deviceInfo: { type: String, default: '' },
    alertSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ScanLog', scanLogSchema);