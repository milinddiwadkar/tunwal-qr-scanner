const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    qrId: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true },
    mobileNumber: { type: String, required: true, index: true },
    email: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    disease: { type: String, default: '' },
    address: { type: String, default: '' },
    vehicleName: { type: String, default: '' },
    chassisNumber: { type: String, default: '' },
    motorNumber: { type: String, default: '' },
    showroomName: { type: String, default: '' },
    otpVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);