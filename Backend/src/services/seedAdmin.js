const bcrypt = require('bcryptjs');
const Admin = require('../models/admin');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('Admin seed skipped: ADMIN_EMAIL or ADMIN_PASSWORD missing');
    return;
  }

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`Admin exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await Admin.create({
    name: 'Super Admin',
    email,
    passwordHash,
    role: 'superadmin',
    isActive: true
  });

  console.log(`Seed admin created: ${email}`);
}

module.exports = seedAdmin;