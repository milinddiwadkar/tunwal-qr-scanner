const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema(
  {
    qrId: { type: String, required: true, unique: true, index: true },
    contacts: [
      {
        name: { type: String, required: true },
        mobile: { type: String, required: true },
        email: { type: String, default: '' },
        relation: { type: String, required: true }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);