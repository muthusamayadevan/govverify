const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const multer = require('multer');

let bucket = null;

const initBucket = () => {
  if (bucket) return bucket;
  if (!mongoose.connection.db) {
    throw new Error('MongoDB connection is not open yet');
  }

  bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'applicationDocs',
  });

  return bucket;
};

mongoose.connection.once('open', () => {
  initBucket();
});

const getBucket = () => {
  if (!bucket) {
    return initBucket();
  }
  return bucket;
};

const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = {
  getBucket,
  upload,
};
