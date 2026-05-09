const Counter = require('../models/Counter');

async function generateQrId() {
  const year = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { name: 'qrId' },
    { $inc: { seq: 1 } },
    {
      returnDocument: 'after',
      upsert: true
    }
  );

  const next = String(counter.seq).padStart(6, '0');
  return `TUNW-QR-${year}-${next}`;
}

module.exports = generateQrId;