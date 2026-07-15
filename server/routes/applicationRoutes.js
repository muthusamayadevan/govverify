const express = require('express');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { upload } = require('../config/gridfs');
const {
  submitApplication,
  getMyApplications,
  getApplicationById,
  downloadDocument,
} = require('../controllers/applicationController');

const router = express.Router();

router.post('/', verifyToken, requireRole('citizen'), upload.array('documents', 5), submitApplication);
router.get('/my', verifyToken, requireRole('citizen'), getMyApplications);
router.get('/:id', verifyToken, getApplicationById);
router.get('/document/:fileId', verifyToken, downloadDocument);

module.exports = router;
