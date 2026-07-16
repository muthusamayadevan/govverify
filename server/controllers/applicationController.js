const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { Readable } = require('stream');
const Application = require('../models/Application');
const { getBucket } = require('../config/gridfs');

const submitApplication = async (req, res) => {
  const { certificateType, details } = req.body;
  const files = req.files || [];

  if (!certificateType || !details) {
    return res.status(400).json({ message: 'certificateType and details are required' });
  }

  try {
    const bucket = getBucket();
    const documents = [];

    console.log('submitApplication files:', files.map((file) => file.originalname));

    for (const file of files) {
      const uploadStream = bucket.openUploadStream(file.originalname, {
        metadata: {
          applicant: new mongoose.Types.ObjectId(req.user.id),
          certificateType,
        },
      });

      const readable = Readable.from(file.buffer);
      readable.pipe(uploadStream);

      await new Promise((resolve, reject) => {
        uploadStream.on('finish', () => {
          documents.push({
            fileId: uploadStream.id,
            filename: file.originalname,
            uploadedAt: new Date(),
          });
          resolve();
        });
        uploadStream.on('error', reject);
      });
    }

    const application = new Application({
      applicant: req.user.id,
      certificateType,
      details,
      documents,
    });

    await application.save();

    return res.status(201).json(application);
  } catch (error) {
    const logMessage = [
      'Submit application error:',
      error.message,
      error.stack,
      `Mongoose readyState: ${mongoose.connection.readyState}`,
    ].join('\n');

    console.error(logMessage);
    fs.appendFileSync(path.join(__dirname, '..', 'application-error.log'), `${new Date().toISOString()}\n${logMessage}\n\n`);
    return res.status(500).json({ message: 'Server error submitting application' });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user.id })
      .sort({ createdAt: -1 });
    return res.json(applications);
  } catch (error) {
    console.error('Get my applications error:', error);
    return res.status(500).json({ message: 'Server error fetching applications' });
  }
};

const getPendingApplications = async (req, res) => {
  try {
    const applications = await Application.find({ status: 'pending' })
      .sort({ createdAt: 1 })
      .populate('applicant', 'name email');
    return res.json(applications);
  } catch (error) {
    console.error('Get pending applications error:', error);
    return res.status(500).json({ message: 'Server error fetching pending applications' });
  }
};

const getAllApplicationsForOfficer = async (req, res) => {
  try {
    const applications = await Application.find()
      .sort({ createdAt: -1 })
      .populate('applicant', 'name email');
    return res.json(applications);
  } catch (error) {
    console.error('Get all applications for officer error:', error);
    return res.status(500).json({ message: 'Server error fetching applications' });
  }
};

const reviewApplication = async (req, res) => {
  const { id } = req.params;
  const { decision, remarks } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid application id' });
  }

  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ message: "Decision must be 'approved' or 'rejected'" });
  }

  try {
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending applications can be reviewed' });
    }

    application.status = decision;
    application.officerRemarks = remarks || '';
    application.reviewedBy = req.user.id;

    await application.save();
    await application.populate('applicant', 'name email');

    return res.json(application);
  } catch (error) {
    console.error('Review application error:', error);
    return res.status(500).json({ message: 'Server error reviewing application' });
  }
};

const getApplicationById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid application id' });
  }

  try {
    const application = await Application.findById(id).populate('applicant reviewedBy', 'name email role');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.applicant._id.toString() !== req.user.id && !['officer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.json(application);
  } catch (error) {
    console.error('Get application by id error:', error);
    return res.status(500).json({ message: 'Server error fetching application' });
  }
};

const downloadDocument = async (req, res) => {
  const { fileId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    return res.status(400).json({ message: 'Invalid file id' });
  }

  try {
    const bucket = getBucket();
    const _id = new mongoose.Types.ObjectId(fileId);
    const downloadStream = bucket.openDownloadStream(_id);

    downloadStream.on('error', (error) => {
      console.error('Download document error:', error);
      if (error.code === 'ENOENT') {
        return res.status(404).json({ message: 'File not found' });
      }
      return res.status(500).json({ message: 'Server error downloading document' });
    });

    res.setHeader('Content-Disposition', 'attachment; filename="document"');
    downloadStream.pipe(res);
  } catch (error) {
    console.error('Download document error:', error);
    return res.status(500).json({ message: 'Server error downloading document' });
  }
};

module.exports = {
  submitApplication,
  getMyApplications,
  getPendingApplications,
  getAllApplicationsForOfficer,
  reviewApplication,
  getApplicationById,
  downloadDocument,
};
