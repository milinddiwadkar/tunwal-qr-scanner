const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema(
  {
    qrId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true
    },

    qrImageDataUrl: {
      type: String,
      default: ''
    },

    // Main public QR entry link.
    // This should open frontend resolver page: /qr/:qrId
    activationLink: {
      type: String,
      required: true
    },

    // Direct emergency page link.
    // This works only after emergency profile is activated.
    emergencyLink: {
      type: String,
      required: true
    },

    /*
      Main QR lifecycle status.
      Use this for admin-level QR control.
    */
    status: {
      type: String,
      enum: [
        'inactive',
        'otp_pending',
        'active',
        'blocked',
        'expired',
        'transferred',
        'scrapped'
      ],
      default: 'inactive',
      index: true
    },

    previousStatus: {
      type: String,
      enum: [
        'inactive',
        'otp_pending',
        'active',
        'blocked',
        'expired',
        'transferred',
        'scrapped',
        ''
      ],
      default: ''
    },

    /*
      Warranty status.
      Warranty is mandatory.
      Actual warranty data is stored in Warranty.js, not here.
    */
    warrantyStatus: {
      type: String,
      enum: ['pending', 'registered'],
      default: 'pending',
      index: true
    },

    warrantyRegisteredAt: {
      type: Date,
      default: null
    },

    /*
      Emergency profile status.
      Emergency is optional and consent-based.
      Actual emergency data stays in Customer.js / EmergencyContact.js.
    */
    emergencyStatus: {
      type: String,
      enum: ['inactive', 'active', 'skipped'],
      default: 'inactive',
      index: true
    },

    emergencyActivatedAt: {
      type: Date,
      default: null
    },

    emergencySkippedAt: {
      type: Date,
      default: null
    },

    ownerMobile: {
      type: String,
      default: '',
      trim: true
    },

    blockedReason: {
      type: String,
      default: '',
      trim: true
    },

    blockedAt: {
      type: Date,
      default: null
    },

    unblockedAt: {
      type: Date,
      default: null
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('QrCode', qrCodeSchema);