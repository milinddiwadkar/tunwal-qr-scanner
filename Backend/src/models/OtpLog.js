const mongoose = require('mongoose');

const otpLogSchema = new mongoose.Schema(
  {
    qrId: { type: String, required: true, index: true },
    mobile: { type: String, required: true, index: true },
    otpCode: { type: String, required: true },
    verified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('OtpLog', otpLogSchema);