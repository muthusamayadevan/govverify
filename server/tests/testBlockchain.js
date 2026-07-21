const contract = require('../config/blockchain');
const { hashCertificateData } = require('../utils/hashDocument');

async function main() {
  try {
    const address = contract.target || contract.address;
    console.log('Contract address:', address);

    const expectedAddress = '0x95345B0e810c664C864Dc396001bb62b2c6e6E2f';
    console.log('Expected address:', expectedAddress);

    const testHash = hashCertificateData({
      referenceId: 'TEST-001',
      applicant: 'Test User',
      certificateType: 'income',
    });
    console.log('Test hash:', testHash);

    const tx = await contract.issueCertificate('TEST-001', testHash);
    console.log('Issue transaction sent, hash:', tx.hash);

    const receipt = await tx.wait();
    console.log('Transaction confirmed, blockNumber:', receipt.blockNumber);

    const result = await contract.verifyCertificate('TEST-001', testHash);
    console.log('Verify result:', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

main();
