const mongoose = require('mongoose');

const taxFilingSchema = new mongoose.Schema({
  taxpayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  financialYear: {
    type: String,
    required: true,
  },
  annualIncome: {
    type: Number,
    required: true,
  },
  deductions: {
    type: Number,
    default: 0,
  },
  taxableIncome: {
    type: Number,
    required: true,
  },
  taxPayable: {
    type: Number,
    required: true,
  },
  receiptId: {
    type: String,
    unique: true,
  },
  receiptPdfFileId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  filedAt: {
    type: Date,
    default: Date.now,
  },
});

taxFilingSchema.pre('save', function () {
  if (this.receiptId) return;

  const year = new Date().getFullYear();
  const randomSix = Math.floor(100000 + Math.random() * 900000);
  this.receiptId = `TAX-${year}-${randomSix}`;
});

const TaxFiling = mongoose.model('TaxFiling', taxFilingSchema);

module.exports = TaxFiling;
