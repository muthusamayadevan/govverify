const mongoose = require('mongoose');
const { Readable } = require('stream');
const TaxFiling = require('../models/TaxFiling');
const calculateTax = require('../utils/calculateTax');
const generateTaxReceiptPDF = require('../utils/generateTaxReceiptPDF');
const sendEmail = require('../utils/sendEmail');
const { getBucket } = require('../config/gridfs');

const fileTax = async (req, res) => {
  const { financialYear, annualIncome, deductions = 0 } = req.body;

  if (!financialYear || annualIncome === undefined || annualIncome === null) {
    return res.status(400).json({ message: 'financialYear and annualIncome are required' });
  }

  const incomeNum = Number(annualIncome);
  const deductionsNum = Number(deductions) || 0;

  if (isNaN(incomeNum) || incomeNum < 0) {
    return res.status(400).json({ message: 'annualIncome must be a valid non-negative number' });
  }

  try {
    const taxableIncome = Math.max(0, incomeNum - deductionsNum);
    const taxPayable = calculateTax(taxableIncome);

    const filing = new TaxFiling({
      taxpayer: req.user.id,
      financialYear,
      annualIncome: incomeNum,
      deductions: deductionsNum,
      taxableIncome,
      taxPayable,
    });

    await filing.save();
    await filing.populate('taxpayer', 'name email');

    // Generate tax receipt PDF & store in GridFS
    try {
      const pdfBuffer = await generateTaxReceiptPDF(filing.toObject());
      const bucket = getBucket();
      const pdfFilename = `tax-receipt-${filing.receiptId || filing._id}.pdf`;

      const uploadStream = bucket.openUploadStream(pdfFilename, {
        metadata: {
          taxpayer: req.user.id,
          type: 'tax_receipt_pdf',
          receiptId: filing.receiptId,
        },
      });

      const readable = Readable.from(pdfBuffer);
      readable.pipe(uploadStream);

      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });

      filing.receiptPdfFileId = uploadStream.id;
      await filing.save();
    } catch (pdfErr) {
      console.error('Tax receipt PDF generation/GridFS upload failed (non-fatal):', pdfErr.message);
    }

    // Send Confirmation Email (non-blocking)
    const taxpayerEmail = filing.taxpayer?.email;
    if (taxpayerEmail) {
      const subject = `Tax Filing Receipt — ${filing.receiptId}`;
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Income Tax Filing Confirmation</h2>
          <p>Dear ${filing.taxpayer?.name || 'Taxpayer'},</p>
          <p>Your income tax return has been successfully filed on GovVerify.</p>
          <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #64748b;">Receipt ID:</td><td style="font-weight: bold; font-family: monospace;">${filing.receiptId}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Financial Year:</td><td style="font-weight: bold;">${filing.financialYear}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Taxable Income:</td><td>Rs. ${new Intl.NumberFormat('en-IN').format(filing.taxableIncome)}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Tax Payable:</td><td style="font-weight: bold; color: #16a34a;">Rs. ${new Intl.NumberFormat('en-IN').format(filing.taxPayable)}</td></tr>
          </table>
          <p>Log in to GovVerify anytime to view or download your official tax receipt PDF.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">GovVerify — Self-Service Income Tax Module</p>
        </div>
      `;
      sendEmail(taxpayerEmail, subject, htmlBody).catch((err) => console.error('Tax email notification error:', err));
    }

    return res.status(201).json(filing);
  } catch (error) {
    console.error('File tax error:', error);
    return res.status(500).json({ message: 'Server error filing tax return' });
  }
};

const getMyTaxFilings = async (req, res) => {
  try {
    const filings = await TaxFiling.find({ taxpayer: req.user.id }).sort({ filedAt: -1 });
    return res.json(filings);
  } catch (error) {
    console.error('Get my tax filings error:', error);
    return res.status(500).json({ message: 'Server error fetching tax filings' });
  }
};

const downloadTaxReceiptPDF = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid filing id' });
  }

  try {
    const filing = await TaxFiling.findById(id).populate('taxpayer', 'name email');
    if (!filing) {
      return res.status(404).json({ message: 'Tax filing not found' });
    }

    const taxpayerId = filing.taxpayer._id ? filing.taxpayer._id.toString() : filing.taxpayer.toString();
    if (taxpayerId !== req.user.id && !['officer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const filename = `tax-receipt-${filing.receiptId || filing._id}.pdf`;
    const bucket = getBucket();

    // 1. Stream stored PDF from GridFS if available
    if (filing.receiptPdfFileId) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(filing.receiptPdfFileId));
      downloadStream.on('error', (err) => {
        console.error('Download tax receipt stream error:', err);
        if (!res.headersSent) {
          return res.status(500).json({ message: 'Server error downloading tax receipt PDF' });
        }
      });
      return downloadStream.pipe(res);
    }

    // 2. Fallback: Generate fresh if missing, upload to GridFS, and stream
    const pdfBuffer = await generateTaxReceiptPDF(filing.toObject());

    try {
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: { taxpayer: req.user.id, type: 'tax_receipt_pdf' },
      });
      const readable = Readable.from(pdfBuffer);
      readable.pipe(uploadStream);

      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });

      filing.receiptPdfFileId = uploadStream.id;
      await filing.save();
    } catch (storeErr) {
      console.error('Fallback tax receipt GridFS store error:', storeErr.message);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Download tax receipt PDF error:', error);
    return res.status(500).json({ message: 'Server error generating tax receipt PDF' });
  }
};

module.exports = {
  fileTax,
  getMyTaxFilings,
  downloadTaxReceiptPDF,
};
