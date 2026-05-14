const mongoose = require('mongoose');

const warrantySchema = new mongoose.Schema(
  {
    qrId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },

    scooterName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    scooterColor: {
      type: String,
      required: true,
      trim: true
    },

    controllerNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },

    batteryNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },

    motorNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },

    chassisNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },

    chargerNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },

    dealerName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    contactNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    dateOfSale: {
      type: Date,
      required: true,
      index: true
    },

    dealerAddress: {
      type: String,
      required: true,
      trim: true
    },

    state: {
      type: String,
      required: true,
      trim: true,
      index: true
    }
  },
  { timestamps: true }
);

/*
  Performance indexes for admin warranty management.
  These help with:
  - QR search
  - Customer/contact search
  - Chassis/motor lookup
  - Dealer/state filter
  - Date-wise/month-wise Excel download
*/

warrantySchema.index({ createdAt: -1 });
warrantySchema.index({ dateOfSale: -1 });
warrantySchema.index({ state: 1, createdAt: -1 });
warrantySchema.index({ dealerName: 1, createdAt: -1 });
warrantySchema.index({ customerName: 1, contactNumber: 1 });

module.exports = mongoose.model('Warranty', warrantySchema);