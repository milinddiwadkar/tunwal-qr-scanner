const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Super Admin' },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['superadmin', 'admin'],
      default: 'superadmin'
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);