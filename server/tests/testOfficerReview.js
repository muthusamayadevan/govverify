const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const OFFICER = {
  email: 'testofficer@gmail.com',
  password: 'test1234',
};

const loginOfficer = async () => {
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    email: OFFICER.email,
    password: OFFICER.password,
  });
  return response.data.token;
};

const getPendingApplications = async (token) => {
  return axios.get(`${BASE_URL}/applications/officer/pending`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const main = async () => {
  try {
    const token = await loginOfficer();
    console.log('Officer login successful');

    const response = await getPendingApplications(token);
    const count = Array.isArray(response.data) ? response.data.length : 0;

    console.log(`Pending applications status: ${response.status}`);
    console.log(`Pending applications count: ${count}`);
  } catch (error) {
    console.error('Test failed');
    console.error(error.response?.status, error.response?.data || error.message);
    process.exit(1);
  }
};

main();
