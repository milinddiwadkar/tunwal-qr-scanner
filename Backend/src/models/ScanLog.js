const mongoose = require('mongoose');

const scanLogSchema = new mongoose.Schema(
  {
    qrId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },

    scanType: {
      type: String,
      enum: ['activation', 'emergency', 'warranty', 'blocked'],
      required: true
    },

    latitude: {
      type: Number,
      default: null
    },

    longitude: {
      type: Number,
      default: null
    },

    ipAddress: {
      type: String,
      default: '',
      trim: true
    },

    deviceInfo: {
      type: String,
      default: '',
      trim: true
    },

    alertSent: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

scanLogSchema.index({ qrId: 1 });
scanLogSchema.index({ scanType: 1 });
scanLogSchema.index({ alertSent: 1 });
scanLogSchema.index({ createdAt: -1 });
scanLogSchema.index({ qrId: 1, createdAt: -1 });
scanLogSchema.index({ scanType: 1, createdAt: -1 });

module.exports = mongoose.model('ScanLog', scanLogSchema);