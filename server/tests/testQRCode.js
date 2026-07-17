const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3001/api';

const CITIZEN = { name: 'Test Citizen 2', email: 'testcitizen2@gmail.com', password: 'test1234', role: 'citizen' };
const OFFICER = { email: 'testofficer@gmail.com', password: 'test1234' };

// ── helpers ──────────────────────────────────────────────────────────────────

const login = async ({ email, password }) => {
  const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  return res.data.token;
};

const ensureCitizen = async () => {
  try {
    return await login(CITIZEN);
  } catch (err) {
    if (err.response?.status !== 401 && err.response?.status !== 400) throw err;
    // Not registered yet — create the account
    await axios.post(`${BASE_URL}/auth/register`, CITIZEN);
    return await login(CITIZEN);
  }
};

const submitApplication = async (token) => {
  const form = new FormData();
  form.append('certificateType', 'educational');
  form.append('details', 'Testing QR code generation');
  // Dummy file — real bytes, but content doesn't matter for this test
  form.append('documents', Buffer.from('dummy test document'), {
    filename: 'dummy.txt',
    contentType: 'text/plain',
  });

  const res = await axios.post(`${BASE_URL}/applications`, form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
  });
  return res.data;
};

const approveApplication = async (applicationId, token) => {
  const res = await axios.patch(
    `${BASE_URL}/applications/${applicationId}/review`,
    { decision: 'approved', remarks: 'QR code test approval' },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data;
};

const getApplication = async (applicationId, token) => {
  const res = await axios.get(`${BASE_URL}/applications/${applicationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── main ─────────────────────────────────────────────────────────────────────

const main = async () => {
  // 1. Citizen login + submit
  console.log('Step 1 — Citizen login...');
  const citizenToken = await ensureCitizen();
  console.log('  ✓ Citizen logged in');

  console.log('Step 1 — Submitting application...');
  const application = await submitApplication(citizenToken);
  console.log(`  ✓ Application submitted — id: ${application._id}, referenceId: ${application.referenceId}`);

  // 2. Officer login + approve
  console.log('Step 2 — Officer login...');
  const officerToken = await login(OFFICER);
  console.log('  ✓ Officer logged in');

  console.log('Step 2 — Approving application...');
  const reviewed = await approveApplication(application._id, officerToken);
  console.log(`  ✓ Application approved — status: ${reviewed.status}`);
  if (reviewed.warning) {
    console.log(`  ⚠ Warning: ${reviewed.warning}`);
  }

  // 3. Wait for blockchain confirmation
  console.log('Step 3 — Waiting 3 seconds for blockchain confirmation...');
  await sleep(3000);
  console.log('  ✓ Wait complete');

  // 4. Fetch the application and verify qrCodeDataUrl
  console.log('Step 4 — Fetching application as officer...');
  const fetched = await getApplication(application._id, officerToken);

  const { referenceId, qrCodeDataUrl } = fetched;
  const QR_PREFIX = 'data:image/png;base64,';

  console.log('');
  console.log('── Results ──────────────────────────────────────────────────');
  console.log(`  referenceId    : ${referenceId}`);
  console.log(`  qrCodeDataUrl  : ${qrCodeDataUrl ? qrCodeDataUrl.slice(0, 50) : '(empty)'}...`);
  console.log('');

  // 5. Assertions
  if (!qrCodeDataUrl) {
    console.error('  ✗ FAIL: qrCodeDataUrl is empty or missing');
    process.exit(1);
  }
  if (!qrCodeDataUrl.startsWith(QR_PREFIX)) {
    console.error(`  ✗ FAIL: qrCodeDataUrl does not start with "${QR_PREFIX}"`);
    console.error(`         Got: ${qrCodeDataUrl.slice(0, 80)}`);
    process.exit(1);
  }

  console.log('  ✓ PASS: qrCodeDataUrl is present and is a valid PNG data URL');
};

main().catch((err) => {
  console.error('Unexpected error:', err.response?.data || err.message);
  process.exit(1);
});
