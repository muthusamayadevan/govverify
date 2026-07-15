const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const applicationSchema = new mongoose.Schema({
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  certificateType: {
    type: String,
    required: true,
    enum: ['income', 'residence', 'caste', 'educational'],
  },
  details: {
    type: String,
    required: true,
  },
  documents: {
    type: [documentSchema],
    default: [],
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  officerRemarks: {
    type: String,
    default: '',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  referenceId: {
    type: String,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

applicationSchema.pre('save', function () {
  if (this.referenceId) return;

  const year = new Date().getFullYear();
  const randomSix = Math.floor(100000 + Math.random() * 900000);
  this.referenceId = `GOV-${year}-${randomSix}`;
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
