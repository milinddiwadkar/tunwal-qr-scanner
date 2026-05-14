const express = require('express');
const router = express.Router();

const {
  registerWarranty,
  getWarrantyBasic
} = require('../controllers/warrantyController');

router.post('/register', registerWarranty);
router.get('/basic/:qrId', getWarrantyBasic);

module.exports = router;