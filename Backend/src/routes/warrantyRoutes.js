const express = require('express');
const router = express.Router();

const warrantyController = require('../controllers/warrantyController');

router.post('/register', warrantyController.registerWarranty);

module.exports = router;