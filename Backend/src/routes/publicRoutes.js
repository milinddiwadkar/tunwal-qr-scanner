const express = require('express');
const rateLimit = require('express-rate-limit');

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

/*
  OTP limiter:
  Maximum 5 OTP requests per IP every 10 minutes.
  This protects your SMS/OTP API from spam.
*/
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 10 minutes.'
  }
});

/*
  Emergency alert limiter:
  Prevents repeated emergency alert spam from same IP.
  Allows 10 alert requests per IP every 10 minutes.
*/
const emergencyAlertLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many emergency alert requests. Please try again later.'
  }
});

/*
  Public QR status
*/
router.get('/qr/:qrId/status', getQrStatus);

/*
  OTP routes
*/
router.post('/otp/send', otpLimiter, sendOtp);
router.post('/otp/verify', verifyOtp);

/*
  Emergency registration
*/
router.post('/register', registerCustomer);

/*
  Emergency public page + actions
*/
router.get('/emergency/:qrId', getEmergencyPage);
router.post('/emergency/skip/:qrId', skipEmergency);
router.post('/emergency/alert', emergencyAlertLimiter, sendEmergencyAlert);

/*
  Scan logs
*/
router.post('/scan-log', createScanLog);

module.exports = router;