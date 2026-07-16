const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api';

const testLogin = async (email, password) => {
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
    console.log(`login success for ${email}:`, res.data);
  } catch (err) {
    console.error(`login failed for ${email}`);
    console.error('status', err.response?.status);
    console.error('data', err.response?.data);
    console.error('message', err.message);
  }
};

(async () => {
  await testLogin('testofficer@gmail.com', 'test1234');
  await testLogin('testcitizen2@gmail.com', 'test1234');
})();
