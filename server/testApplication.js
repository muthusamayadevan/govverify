const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  name: 'Test Citizen 2',
  email: 'testcitizen2@gmail.com',
  password: 'test1234',
  role: 'citizen',
};
const TEST_FILE_PATH = path.join(__dirname, 'tmp-test-document.txt');

const writeTestFile = async () => {
  const content = 'test document content';
  await fs.promises.writeFile(TEST_FILE_PATH, content, 'utf8');
};

const login = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    console.log('Login successful');
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    console.log(`Login failed (${status || 'unknown'}): ${message}`);
    throw error;
  }
};

const register = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      name: TEST_USER.name,
      email: TEST_USER.email,
      password: TEST_USER.password,
      role: TEST_USER.role,
    });
    console.log('Registration successful');
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    console.log(`Registration failed (${status || 'unknown'}): ${message}`);
    throw error;
  }
};

const submitApplication = async (token) => {
  try {
    await writeTestFile();

    const form = new FormData();
    form.append('certificateType', 'income');
    form.append('details', 'Requesting income certificate for loan application');
    form.append('documents', fs.createReadStream(TEST_FILE_PATH));

    const response = await axios.post(`${BASE_URL}/applications`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });

    const app = response.data;
    console.log('Application submitted successfully');
    console.log(`Status code: ${response.status}`);
    console.log(`Reference ID: ${app.referenceId}`);
    console.log(`Documents count: ${app.documents?.length ?? 0}`);
    if (app.documents && app.documents.length > 0) {
      console.log(`First document fileId: ${app.documents[0].fileId}`);
    }
    return app;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    console.error(`Submit application failed (${status || 'unknown'}): ${message}`);
    throw error;
  }
};

const getMyApplications = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/applications/my`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Fetched my applications successfully');
    console.log(`Applications count: ${response.data.length}`);
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    console.error(`Fetching applications failed (${status || 'unknown'}): ${message}`);
    throw error;
  }
};

const main = async () => {
  try {
    let loginData;
    try {
      loginData = await login();
    } catch (loginError) {
      console.log('Attempting to register test user...');
      await register();
      loginData = await login();
    }

    const token = loginData.token;
    if (!token) {
      throw new Error('No token returned from login');
    }

    await submitApplication(token);
    await getMyApplications(token);
  } catch (error) {
    console.error('Test flow ended with an error');
    process.exitCode = 1;
  } finally {
    try {
      if (fs.existsSync(TEST_FILE_PATH)) {
        await fs.promises.unlink(TEST_FILE_PATH);
      }
    } catch (cleanupError) {
      console.warn('Could not remove temporary test file:', cleanupError.message);
    }
  }
};

main();
