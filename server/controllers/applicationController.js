const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const { Readable } = require('stream');
const Application = require('../models/Application');
const { getBucket } = require('../config/gridfs');
const contract = require('../config/blockchain');
const { hashCertificateData } = require('../utils/hashDocument');

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

const verifyCertificatePublic = async (req, res) => {
  const { referenceId } = req.params;

  try {
    const application = await Application.findOne({ referenceId }).populate('applicant', 'name');
    if (!application) {
      return res.status(404).json({ valid: false, message: 'No certificate found with this reference ID' });
    }

    if (application.status !== 'approved') {
      return res.status(200).json({ valid: false, message: 'This application has not been approved yet' });
    }

    if (!application.certificateHash || !application.approvedAt) {
      return res.status(200).json({
        valid: false,
        message: 'Certificate exists but blockchain verification data is missing',
      });
    }

    const certificateData = {
      referenceId: application.referenceId,
      applicantId: application.applicant._id || application.applicant,
      certificateType: application.certificateType,
      approvedAt: application.approvedAt.toISOString(),
    };

    const recomputedHash = hashCertificateData(certificateData);
    const [isValid, issuedAt] = await contract.verifyCertificate(application.referenceId, recomputedHash);

    const issuedAtNumber = Number(issuedAt);
    const issuedAtDate = issuedAtNumber > 0 ? new Date(issuedAtNumber * 1000).toISOString() : null;

    return res.status(200).json({
      valid: Boolean(isValid),
      referenceId: application.referenceId,
      certificateType: application.certificateType,
      issuedAt: issuedAtDate,
      applicantName: application.applicant?.name || '',
      blockchainTxHash: application.blockchainTxHash,
    });
  } catch (error) {
    console.error('Public certificate verification error:', error);
    return res.status(500).json({ valid: false, message: 'Server error verifying certificate' });
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

    if (decision === 'approved') {
      application.approvedAt = new Date();
      await application.save();

      const certificateData = {
        referenceId: application.referenceId,
        applicantId: application.applicant,
        certificateType: application.certificateType,
        approvedAt: application.approvedAt.toISOString(),
      };

      let responseWarning = null;

      try {
        const certificateHash = hashCertificateData(certificateData);
        console.log('Attempting blockchain issuance for referenceId:', application.referenceId);

        const tx = await contract.issueCertificate(application.referenceId, certificateHash);
        const receipt = await tx.wait();

        console.log('Blockchain tx confirmed:', tx.hash);

        application.certificateHash = certificateHash;
        application.blockchainTxHash = tx.hash;

        // QR code generation — non-blocking: a failure here must not prevent approval
        try {
          const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${application.referenceId}`;
          application.qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);
          console.log('QR code generated for referenceId:', application.referenceId);
        } catch (qrError) {
          console.error('QR code generation failed (non-fatal):', qrError.message);
        }

        await application.save();
      } catch (blockchainError) {
        console.error('Blockchain issuance failed:', blockchainError.message);
        responseWarning = 'Approved, but blockchain certificate issuance failed — retry needed';
      }

      await application.populate('applicant', 'name email');
      const responseData = application.toObject();
      if (responseWarning) {
        responseData.warning = responseWarning;
      }
      return res.json(responseData);
    }

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
  verifyCertificatePublic,
};
