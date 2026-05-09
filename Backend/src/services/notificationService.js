const AlertLog = require('../models/AlertLog');

async function sendMockSms({ qrId, recipientName, recipientMobile, message }) {
  console.log(`MOCK SMS -> ${recipientMobile}: ${message}`);

  await AlertLog.create({
    qrId,
    alertType: 'sms',
    recipientName,
    recipientMobile,
    message,
    status: 'mocked'
  });

  return { success: true };
}

async function sendMockEmail({ qrId, recipientName, recipientEmail, message }) {
  console.log(`MOCK EMAIL -> ${recipientEmail}: ${message}`);

  await AlertLog.create({
    qrId,
    alertType: 'email',
    recipientName,
    recipientEmail,
    message,
    status: 'mocked'
  });

  return { success: true };
}

module.exports = {
  sendMockSms,
  sendMockEmail
};