const express = require('express');
const router = express.Router();

const {
  loginAdmin,
  createQr,
  bulkCreateQr,
  getDashboard,
  listQrs,
  getQrById,
  updateQr,
  updateQrDetails,
  blockQr,
  unblockQr,
  resetQr,
  getCustomers,
  getScanLogs,
  getAnalytics
} = require('../controllers/adminController');

const { protectAdmin } = require('../middleware/authMiddleware');

router.post('/login', loginAdmin);

router.get('/dashboard', protectAdmin, getDashboard);

router.post('/create-qr', protectAdmin, createQr);
router.post('/create-qr-bulk', protectAdmin, bulkCreateQr);

router.get('/qr-list', protectAdmin, listQrs);

router.get('/qr/:id', protectAdmin, getQrById);
router.put('/qr/:id', protectAdmin, updateQr);
router.patch('/qr/:id/details', protectAdmin, updateQrDetails);
router.patch('/qr/:id/block', protectAdmin, blockQr);
router.patch('/qr/:id/unblock', protectAdmin, unblockQr);
router.patch('/qr/:id/reset', protectAdmin, resetQr);

router.get('/customers', protectAdmin, getCustomers);
router.get('/scan-logs', protectAdmin, getScanLogs);
router.get('/analytics', protectAdmin, getAnalytics);

module.exports = router;