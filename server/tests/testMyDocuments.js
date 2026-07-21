const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const CITIZEN = {
  email: 'testcitizen2@gmail.com',
  password: 'test1234',
};

async function testMyDocuments() {
  try {
    console.log('Testing My Documents Endpoint...');

    const loginRes = await axios.post(`${BASE_URL}/auth/login`, CITIZEN);
    const token = loginRes.data.token;

    const res = await axios.get(`${BASE_URL}/applications/my-documents`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✓ GET /applications/my-documents status:', res.status);
    console.log(`  Found ${res.data.length} total document items in vault.`);
    res.data.forEach((doc, idx) => {
      console.log(`  [${idx + 1}] Type: ${doc.documentType} | Title: ${doc.title} | Ref: ${doc.referenceId}`);
    });

    console.log('\nAll My Documents tests PASSED successfully!');
  } catch (err) {
    console.error('My Documents test failed:', err.response?.data || err.message);
    process.exitCode = 1;
  }
}

testMyDocuments();
