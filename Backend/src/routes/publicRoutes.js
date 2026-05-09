const express = require('express');
const router = express.Router();

const {
  getQrStatus,
  sendOtp,
  verifyOtp,
  registerCustomer,
  getEmergencyPage,
  createScanLog,
  sendEmergencyAlert,
  skipEmergency
} = require('../controllers/publicController');

router.get('/qr/:qrId/status', getQrStatus);

router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);

router.post('/register', registerCustomer);

router.get('/emergency/:qrId', getEmergencyPage);
router.post('/emergency/skip/:qrId', skipEmergency);
router.post('/emergency/alert', sendEmergencyAlert);

router.post('/scan-log', createScanLog);

module.exports = router;