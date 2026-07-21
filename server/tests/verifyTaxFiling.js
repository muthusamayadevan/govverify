const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';
const CITIZEN = {
  name: 'Test Citizen 2',
  email: 'testcitizen2@gmail.com',
  password: 'test1234',
  role: 'citizen',
};

async function loginCitizen() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: CITIZEN.email,
      password: CITIZEN.password,
    });
    return response.data.token;
  } catch (err) {
    // Attempt registration if login fails
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        name: CITIZEN.name,
        email: CITIZEN.email,
        password: CITIZEN.password,
        role: CITIZEN.role,
      });
    } catch (regErr) {
      // Ignore registration error
    }
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: CITIZEN.email,
      password: CITIZEN.password,
    });
    return response.data.token;
  }
}

async function verifyTaxFiling() {
  console.log('===========================================================');
  console.log('            GovVerify Tax Filing Verification              ');
  console.log('===========================================================\n');

  let passed = true;

  // Check 1: Login
  let token;
  try {
    token = await loginCitizen();
    console.log('Check 1 [Login as Citizen]: PASS');
  } catch (err) {
    console.error('Check 1 [Login as Citizen]: FAIL -', err.response?.data || err.message);
    process.exitCode = 1;
    return;
  }

  // Check 2 & 3: File tax return & verify calculation values
  let filedData;
  const payload = {
    financialYear: '2025-26',
    annualIncome: 1000000,
    deductions: 50000,
  };

  try {
    const res = await axios.post(`${BASE_URL}/tax`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    filedData = res.data;
    console.log('Check 2 [POST /api/tax Filing Submission]: PASS');
  } catch (err) {
    console.error('Check 2 [POST /api/tax Filing Submission]: FAIL -', err.response?.data || err.message);
    passed = false;
  }

  if (filedData) {
    const isTaxableValid = filedData.taxableIncome === 950000;
    const isTaxPayableValid = filedData.taxPayable === 52500;

    if (isTaxableValid && isTaxPayableValid) {
      console.log(`Check 3 [Calculation Verification - Taxable: ${filedData.taxableIncome}, Tax Payable: ${filedData.taxPayable}]: PASS`);
    } else {
      console.error(`Check 3 [Calculation Verification]: FAIL - Expected taxableIncome: 950000, taxPayable: 52500. Received taxableIncome: ${filedData.taxableIncome}, taxPayable: ${filedData.taxPayable}`);
      passed = false;
    }
  } else {
    console.error('Check 3 [Calculation Verification]: FAIL - No filing data returned');
    passed = false;
  }

  // Check 4: Fetch list and confirm filing appears
  try {
    const listRes = await axios.get(`${BASE_URL}/tax/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const found = Array.isArray(listRes.data) && listRes.data.some((f) => f.receiptId === filedData?.receiptId);

    if (found) {
      console.log(`Check 4 [GET /api/tax/my List Verification - Found Receipt ${filedData?.receiptId}]: PASS`);
    } else {
      console.error('Check 4 [GET /api/tax/my List Verification]: FAIL - Submitted receipt not found in user filings');
      passed = false;
    }
  } catch (err) {
    console.error('Check 4 [GET /api/tax/my List Verification]: FAIL -', err.response?.data || err.message);
    passed = false;
  }

  console.log('\n-----------------------------------------------------------');
  if (passed) {
    console.log('FINAL RESULT: ALL CHECKS PASSED SUCCESSFULLY (PASS)');
  } else {
    console.error('FINAL RESULT: ONE OR MORE CHECKS FAILED (FAIL)');
    process.exitCode = 1;
  }
  console.log('-----------------------------------------------------------\n');
}

verifyTaxFiling();
