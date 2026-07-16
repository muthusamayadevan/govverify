const express = require('express');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { upload } = require('../config/gridfs');
const {
  submitApplication,
  getMyApplications,
  getPendingApplications,
  getAllApplicationsForOfficer,
  reviewApplication,
  verifyCertificatePublic,
  getApplicationById,
  downloadDocument,
} = require('../controllers/applicationController');

const router = express.Router();

router.post('/', verifyToken, requireRole('citizen'), upload.array('documents', 5), submitApplication);
router.get('/my', verifyToken, requireRole('citizen'), getMyApplications);
router.get('/officer/pending', verifyToken, requireRole('officer', 'admin'), getPendingApplications);
router.get('/officer/all', verifyToken, requireRole('officer', 'admin'), getAllApplicationsForOfficer);
router.patch('/:id/review', verifyToken, requireRole('officer', 'admin'), reviewApplication);
router.get('/verify/:referenceId', verifyCertificatePublic);
router.get('/:id', verifyToken, getApplicationById);
router.get('/document/:fileId', verifyToken, downloadDocument);

module.exports = router;
