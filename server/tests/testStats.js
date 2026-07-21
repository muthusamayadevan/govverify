const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const OFFICER = {
  email: 'benchmarkofficer@gmail.com',
  password: 'test1234',
};

async function testStats() {
  try {
    console.log('Testing Officer Stats Endpoint...');

    const loginRes = await axios.post(`${BASE_URL}/auth/login`, OFFICER);
    const token = loginRes.data.token;

    const statsRes = await axios.get(`${BASE_URL}/applications/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✓ GET /applications/stats response:');
    console.log(JSON.stringify(statsRes.data, null, 2));

    console.log('\nOfficer stats endpoint test PASSED successfully!');
  } catch (err) {
    console.error('Stats endpoint test failed:', err.response?.data || err.message);
    process.exitCode = 1;
  }
}

testStats();
