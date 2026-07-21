const express = require('express');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { fileTax, getMyTaxFilings, downloadTaxReceiptPDF } = require('../controllers/taxController');

const router = express.Router();

router.post('/', verifyToken, requireRole('citizen'), fileTax);
router.get('/my', verifyToken, requireRole('citizen'), getMyTaxFilings);
router.get('/:id/receipt-pdf', verifyToken, requireRole('citizen'), downloadTaxReceiptPDF);

module.exports = router;
