const { ethers } = require('ethers');

function hashCertificateData({ referenceId, applicant, certificateType }) {
  return ethers.keccak256(
    ethers.toUtf8Bytes(`${referenceId}|${applicant}|${certificateType}`)
  );
}

module.exports = { hashCertificateData };
