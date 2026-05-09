const mongoose = require('mongoose');

const warrantySchema = new mongoose.Schema(
  {
    qrId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },

    scooterName: {
      type: String,
      required: true,
      trim: true
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
      trim: true
    },

    batteryNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },

    motorNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },

    chassisNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },

    chargerNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },

    dealerName: {
      type: String,
      required: true,
      trim: true
    },

    customerName: {
      type: String,
      required: true,
      trim: true
    },

    contactNumber: {
      type: String,
      required: true,
      trim: true
    },

    dateOfSale: {
      type: Date,
      required: true
    },

    dealerAddress: {
      type: String,
      required: true,
      trim: true
    },

    state: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Warranty', warrantySchema);