const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const CITIZEN = {
  email: 'testcitizen2@gmail.com',
  password: 'test1234',
};

async function testPdfGridFS() {
  try {
    console.log('Testing GridFS PDF Persistence...');

    // 1. Login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, CITIZEN);
    const token = loginRes.data.token;
    console.log('✓ Login successful');

    // 2. File Tax Return
    const taxRes = await axios.post(
      `${BASE_URL}/tax`,
      { financialYear: '2025-26', annualIncome: 1200000, deductions: 50000 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✓ Tax Filed:', taxRes.data.receiptId);
    console.log('  GridFS Receipt PDF FileId:', taxRes.data.receiptPdfFileId);

    // 3. Download Tax Receipt PDF from GridFS stream
    const pdfRes = await axios.get(`${BASE_URL}/tax/${taxRes.data._id}/receipt-pdf`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer',
    });
    console.log('✓ Downloaded Tax Receipt PDF. Byte size:', pdfRes.data.length);
    console.log('  Content-Type:', pdfRes.headers['content-type']);

    console.log('\nAll GridFS PDF persistence tests PASSED successfully!');
  } catch (err) {
    console.error('GridFS PDF test failed:', err.response?.data || err.message);
    process.exitCode = 1;
  }
}

testPdfGridFS();
