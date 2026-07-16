const contract = require('../config/blockchain');
const { hashCertificateData } = require('../utils/hashDocument');

async function main() {
  try {
    const address = contract.target || contract.address;
    console.log('Contract address:', address);

    const expectedAddress = '0xdAc4250d233E3C8F2253d0DB61b83E9393b5E30d';
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
