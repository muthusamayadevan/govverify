const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:5000/api';
const CITIZEN = {
  name: 'Test Citizen 2',
  email: 'testcitizen2@gmail.com',
  password: 'test1234',
  role: 'citizen',
};
const OFFICER = {
  email: 'testofficer@gmail.com',
  password: 'test1234',
};
const TEMP_FILE = path.join(__dirname, 'tmp-verification-test.txt');

const writeDummyFile = async () => {
  await fs.promises.writeFile(TEMP_FILE, 'Dummy certificate verification test file', 'utf8');
};

const login = async (email, password) => {
  const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  return response.data;
};

const registerCitizen = async () => {
  return axios.post(`${BASE_URL}/auth/register`, {
    name: CITIZEN.name,
    email: CITIZEN.email,
    password: CITIZEN.password,
    role: CITIZEN.role,
  });
};

const submitApplication = async (token) => {
  const form = new FormData();
  form.append('certificateType', 'residence');
  form.append('details', 'Testing verification endpoint');
  form.append('documents', fs.createReadStream(TEMP_FILE));

  const response = await axios.post(`${BASE_URL}/applications`, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

const approveApplication = async (token, applicationId) => {
  const response = await axios.patch(
    `${BASE_URL}/applications/${applicationId}/review`,
    { decision: 'approved', remarks: 'Approval from testVerification.js' },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

const verifyPublic = async (referenceId) => {
  const response = await axios.get(`${BASE_URL}/applications/verify/${referenceId}`);
  return response.data;
};

const main = async () => {
  try {
    await writeDummyFile();

    let citizenLogin;
    try {
      citizenLogin = await login(CITIZEN.email, CITIZEN.password);
      console.log('Citizen login successful');
    } catch (error) {
      console.log('Citizen login failed, attempting registration...');
      await registerCitizen();
      citizenLogin = await login(CITIZEN.email, CITIZEN.password);
      console.log('Citizen registered and logged in successfully');
    }

    const citizenToken = citizenLogin.token;
    console.log('Submitting test application...');
    const application = await submitApplication(citizenToken);
    console.log('Application submitted:', application.referenceId, application._id);

    let officerLogin;
    try {
      officerLogin = await login(OFFICER.email, OFFICER.password);
      console.log('Officer login successful');
    } catch (error) {
      throw new Error('Officer login failed. Ensure test officer exists with correct credentials.');
    }

    const officerToken = officerLogin.token;
    console.log('Approving application id:', application._id);
    const approvedApp = await approveApplication(officerToken, application._id);
    console.log('Application approved. Reference ID:', approvedApp.referenceId);

    console.log('Waiting 3 seconds for blockchain settlement...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('Calling public verification endpoint for real referenceId...');
    const verificationResult = await verifyPublic(approvedApp.referenceId);
    console.log('Real verification response:', JSON.stringify(verificationResult, null, 2));

    const fakeReferenceId = 'GOV-2026-000000';
    console.log('Calling public verification endpoint for fake referenceId:', fakeReferenceId);
    try {
      const fakeResult = await verifyPublic(fakeReferenceId);
      console.log('Fake verification response:', JSON.stringify(fakeResult, null, 2));
      console.error('ERROR: fake reference ID should not return a successful response');
      process.exitCode = 1;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('PASS: fake reference ID correctly returned 404');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('TestVerification failed:');
    console.error(error.response?.status, error.response?.data || error.message);
    process.exitCode = 1;
  } finally {
    try {
      if (fs.existsSync(TEMP_FILE)) {
        await fs.promises.unlink(TEMP_FILE);
      }
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError.message);
    }
  }
};

main();
