const mongoose = require('mongoose');

const alertLogSchema = new mongoose.Schema(
  {
    qrId: { type: String, required: true, index: true },
    alertType: {
      type: String,
      enum: ['sms', 'email', 'system'],
      default: 'system'
    },
    recipientName: { type: String, default: '' },
    recipientMobile: { type: String, default: '' },
    recipientEmail: { type: String, default: '' },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['sent', 'failed', 'mocked'],
      default: 'mocked'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AlertLog', alertLogSchema);