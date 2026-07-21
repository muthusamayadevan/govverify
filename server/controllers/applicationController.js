const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const { Readable } = require('stream');
const Application = require('../models/Application');
const TaxFiling = require('../models/TaxFiling');
const { getBucket } = require('../config/gridfs');
const contract = require('../config/blockchain');
const { hashCertificateData } = require('../utils/hashDocument');
const sendEmail = require('../utils/sendEmail');

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
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'name email');
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

    if (application.status === 'revoked' || application.status === 'Revoked') {
      return res.status(200).json({
        valid: false,
        isRevoked: true,
        referenceId: application.referenceId,
        certificateType: application.certificateType,
        applicantName: application.applicant?.name || '',
        blockchainTxHash: application.blockchainTxHash,
        message: 'THIS CERTIFICATE HAS BEEN REVOKED',
      });
    }

    if (application.status !== 'approved' && application.status !== 'Approved') {
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
    let isValid = false;
    let issuedAt = 0;
    let isRevoked = false;

    try {
      const resTuple = await contract.verifyCertificate(application.referenceId, recomputedHash);
      isValid = Boolean(resTuple[0]);
      issuedAt = resTuple[1];
      isRevoked = Boolean(resTuple[2]);
    } catch (contractErr) {
      console.error('Contract verify call error:', contractErr.message);
    }

    const issuedAtNumber = Number(issuedAt);
    const issuedAtDate = issuedAtNumber > 0 ? new Date(issuedAtNumber * 1000).toISOString() : null;

    if (isRevoked) {
      return res.status(200).json({
        valid: false,
        isRevoked: true,
        referenceId: application.referenceId,
        certificateType: application.certificateType,
        issuedAt: issuedAtDate,
        applicantName: application.applicant?.name || '',
        blockchainTxHash: application.blockchainTxHash,
        message: 'THIS CERTIFICATE HAS BEEN REVOKED',
      });
    }

    return res.status(200).json({
      valid: Boolean(isValid),
      isRevoked: false,
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

        // Generate PDF certificate & store permanently in GridFS
        try {
          await application.populate('applicant reviewedBy', 'name email');
          const pdfBuffer = await generateCertificatePDF(application.toObject());
          const bucket = getBucket();
          const pdfFilename = `certificate-${application.referenceId || application._id}.pdf`;
          const uploadStream = bucket.openUploadStream(pdfFilename, {
            metadata: {
              applicant: application.applicant._id || application.applicant,
              type: 'certificate_pdf',
              referenceId: application.referenceId,
            },
          });

          const readable = Readable.from(pdfBuffer);
          readable.pipe(uploadStream);

          await new Promise((resolve, reject) => {
            uploadStream.on('finish', resolve);
            uploadStream.on('error', reject);
          });

          application.certificatePdfFileId = uploadStream.id;
          console.log('Certificate PDF stored in GridFS fileId:', uploadStream.id);
        } catch (pdfError) {
          console.error('Certificate PDF generation/GridFS upload failed (non-fatal):', pdfError.message);
        }

        await application.save();
      } catch (blockchainError) {
        console.error('Blockchain issuance failed:', blockchainError.message);
        responseWarning = 'Approved, but blockchain certificate issuance failed — retry needed';
      }

      await application.populate('applicant', 'name email');

      // Send Email Notification for Approval (non-blocking)
      const applicantEmail = application.applicant?.email;
      if (applicantEmail) {
        const subject = `Your GovVerify Application Has Been Approved — ${application.referenceId}`;
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #16a34a; margin-top: 0;">Application Approved</h2>
            <p>Dear ${application.applicant?.name || 'Citizen'},</p>
            <p>Your certificate application has been reviewed and <strong>APPROVED</strong>.</p>
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #64748b;">Certificate Type:</td><td style="font-weight: bold;">${application.certificateType}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b;">Reference ID:</td><td style="font-weight: bold; font-family: monospace;">${application.referenceId}</td></tr>
              ${application.officerRemarks ? `<tr><td style="padding: 8px 0; color: #64748b;">Officer Remarks:</td><td style="font-style: italic;">${application.officerRemarks}</td></tr>` : ''}
            </table>
            <p>Log in to GovVerify to download your certificate and QR code.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #94a3b8;">GovVerify — Blockchain Digital Document Verification System</p>
          </div>
        `;
        sendEmail(applicantEmail, subject, htmlBody).catch((err) => console.error('Email notification error:', err));
      }

      const responseData = application.toObject();
      if (responseWarning) {
        responseData.warning = responseWarning;
      }
      return res.json(responseData);
    }

    await application.save();
    await application.populate('applicant', 'name email');

    // Send Email Notification for Rejection (non-blocking)
    const applicantEmail = application.applicant?.email;
    if (applicantEmail) {
      const subject = `Your GovVerify Application Update — ${application.referenceId}`;
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #dc2626; margin-top: 0;">Application Update</h2>
          <p>Dear ${application.applicant?.name || 'Citizen'},</p>
          <p>Your application for <strong>${application.certificateType}</strong> (Reference ID: <span style="font-family: monospace;">${application.referenceId}</span>) has been reviewed and <strong>REJECTED</strong>.</p>
          ${application.officerRemarks ? `<p><strong>Officer Remarks:</strong> <em>${application.officerRemarks}</em></p>` : ''}
          <p>Please log in to your GovVerify dashboard for further details or to submit a new application.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">GovVerify — Blockchain Digital Document Verification System</p>
        </div>
      `;
      sendEmail(applicantEmail, subject, htmlBody).catch((err) => console.error('Email notification error:', err));
    }

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

const generateCertificatePDF = require('../utils/generateCertificatePDF');

const downloadCertificatePDF = async (req, res) => {
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

    if (application.status !== 'approved') {
      return res.status(400).json({ message: 'Certificate PDF is only available for approved applications' });
    }

    const filename = `certificate-${application.referenceId || application._id}.pdf`;
    const bucket = getBucket();

    // 1. Stream stored PDF directly from GridFS if it exists
    if (application.certificatePdfFileId) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(application.certificatePdfFileId));
      downloadStream.on('error', (err) => {
        console.error('Download certificate stream error:', err);
        if (!res.headersSent) {
          return res.status(500).json({ message: 'Server error downloading certificate PDF stream' });
        }
      });
      return downloadStream.pipe(res);
    }

    // 2. Fallback: Generate PDF fresh, store in GridFS for future requests, and send buffer
    const pdfBuffer = await generateCertificatePDF(application.toObject());

    try {
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: {
          applicant: application.applicant._id,
          type: 'certificate_pdf',
          referenceId: application.referenceId,
        },
      });

      const readable = Readable.from(pdfBuffer);
      readable.pipe(uploadStream);

      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });

      application.certificatePdfFileId = uploadStream.id;
      await application.save();
    } catch (storeErr) {
      console.error('Fallback GridFS store error:', storeErr.message);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Download certificate PDF error:', error);
    return res.status(500).json({ message: 'Server error generating certificate PDF' });
  }
};

const getMyDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch approved certificates & applicant uploaded documents
    const applications = await Application.find({ applicant: userId }).sort({ createdAt: -1 });

    const certificateDocs = applications
      .filter((app) => app.status === 'approved')
      .map((app) => ({
        id: app._id,
        title: `${app.certificateType.toUpperCase()} Certificate`,
        referenceId: app.referenceId,
        date: app.approvedAt || app.createdAt,
        documentType: 'certificate',
        fileId: app.certificatePdfFileId,
        downloadUrl: `/applications/${app._id}/certificate-pdf`,
      }));

    const supportingDocs = [];
    applications.forEach((app) => {
      if (app.documents && app.documents.length > 0) {
        app.documents.forEach((doc) => {
          supportingDocs.push({
            id: doc.fileId,
            title: doc.filename,
            referenceId: app.referenceId,
            date: doc.uploadedAt || app.createdAt,
            documentType: 'supporting_document',
            fileId: doc.fileId,
            downloadUrl: `/applications/document/${doc.fileId}`,
          });
        });
      }
    });

    // 2. Fetch tax receipt PDFs
    const taxFilings = await TaxFiling.find({ taxpayer: userId }).sort({ filedAt: -1 });

    const taxDocs = taxFilings.map((filing) => ({
      id: filing._id,
      title: `Tax Payment Receipt (FY ${filing.financialYear})`,
      referenceId: filing.receiptId,
      date: filing.filedAt,
      documentType: 'tax_receipt',
      fileId: filing.receiptPdfFileId,
      downloadUrl: `/tax/${filing._id}/receipt-pdf`,
    }));

    // Combine all and sort by date descending
    const allDocuments = [...certificateDocs, ...taxDocs, ...supportingDocs].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    return res.json(allDocuments);
  } catch (error) {
    console.error('Get my documents error:', error);
    return res.status(500).json({ message: 'Server error fetching user documents' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const statusCounts = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const typeCounts = await Application.aggregate([
      {
        $group: {
          _id: '$certificateType',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    let total = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let revoked = 0;

    statusCounts.forEach((item) => {
      total += item.count;
      if (item._id === 'pending') pending = item.count;
      if (item._id === 'approved' || item._id === 'Approved') approved = item.count;
      if (item._id === 'rejected' || item._id === 'Rejected') rejected = item.count;
      if (item._id === 'revoked' || item._id === 'Revoked') revoked = item.count;
    });

    const byCertificateType = typeCounts.map((item) => ({
      type: item._id,
      count: item.count,
    }));

    return res.json({
      total,
      pending,
      approved,
      rejected,
      revoked,
      byCertificateType,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ message: 'Server error calculating dashboard statistics' });
  }
};

const revokeApplication = async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body || {};

  try {
    let application;
    if (mongoose.Types.ObjectId.isValid(id)) {
      application = await Application.findById(id);
    } else {
      application = await Application.findOne({ referenceId: id });
    }

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'approved' && application.status !== 'Approved') {
      return res.status(400).json({ message: 'Only approved certificates can be revoked' });
    }

    console.log('Attempting blockchain certificate revocation for referenceId:', application.referenceId);

    const tx = await contract.revokeCertificate(application.referenceId);
    const receipt = await tx.wait();

    console.log('Blockchain revocation tx confirmed:', tx.hash);

    application.status = 'Revoked';
    if (remarks) {
      application.officerRemarks = remarks;
    }
    await application.save();

    await application.populate('applicant reviewedBy', 'name email role');

    return res.status(200).json({
      message: 'Certificate successfully revoked on-chain and in database',
      application,
      blockchainTxHash: tx.hash,
    });
  } catch (error) {
    console.error('Revoke application error:', error);
    return res.status(500).json({
      message: error.message || 'Server error revoking certificate',
    });
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
  downloadCertificatePDF,
  getMyDocuments,
  getDashboardStats,
  revokeApplication,
};
