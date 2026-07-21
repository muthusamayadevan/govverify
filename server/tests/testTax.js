const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const CITIZEN = {
  name: 'Test Citizen 2',
  email: 'testcitizen2@gmail.com',
  password: 'test1234',
};

async function testTaxModule() {
  try {
    console.log('Testing Tax Filing Module...');

    // 1. Login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: CITIZEN.email,
      password: CITIZEN.password,
    });
    const token = loginRes.data.token;
    console.log('✓ Login successful');

    // 2. File Tax Return
    const filingPayload = {
      financialYear: '2025-26',
      annualIncome: 1000000, // 10 Lakhs
      deductions: 50000,     // 50k
    };
    // Taxable = 9,50,000
    // Slabs:
    // 0-3L: 0
    // 3L-6L (3L * 5%): 15,000
    // 6L-9L (3L * 10%): 30,000
    // 9L-9.5L (50k * 15%): 7,500
    // Total Tax Payable = 52,500

    const fileRes = await axios.post(`${BASE_URL}/tax`, filingPayload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✓ File Tax Response:', fileRes.status);
    console.log('  Receipt ID:', fileRes.data.receiptId);
    console.log('  Annual Income:', fileRes.data.annualIncome);
    console.log('  Deductions:', fileRes.data.deductions);
    console.log('  Taxable Income:', fileRes.data.taxableIncome);
    console.log('  Tax Payable:', fileRes.data.taxPayable);

    // 3. Fetch My Tax Filings
    const getRes = await axios.get(`${BASE_URL}/tax/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✓ Fetch Tax Filings Response:', getRes.status);
    console.log(`  Found ${getRes.data.length} filings for user.`);

    console.log('\nAll tax module tests PASSED successfully!');
  } catch (err) {
    console.error('Tax module test failed:', err.response?.data || err.message);
    process.exitCode = 1;
  }
}

testTaxModule();
