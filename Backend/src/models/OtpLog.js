const mongoose = require('mongoose');

const otpLogSchema = new mongoose.Schema(
  {
    qrId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },

    mobile: {
      type: String,
      required: true,
      trim: true
    },

    otpCode: {
      type: String,
      required: true
    },

    verified: {
      type: Boolean,
      default: false
    },

    attempts: {
      type: Number,
      default: 0
    },

    expiresAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

/*
  Indexes:
  - Fast OTP lookup by QR + mobile + verified status
  - Fast resend/cooldown lookup by QR + mobile + latest createdAt
  - Auto-delete expired OTP records using TTL index on expiresAt
*/
otpLogSchema.index({
  qrId: 1,
  mobile: 1,
  verified: 1,
  createdAt: -1
});

otpLogSchema.index({
  qrId: 1,
  mobile: 1,
  createdAt: -1
});

otpLogSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model('OtpLog', otpLogSchema);