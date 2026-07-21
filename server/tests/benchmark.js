const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { performance } = require('perf_hooks');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';
const RESULTS_FILE = path.join(__dirname, 'benchmark-results.json');
const TEMP_FILE = path.join(__dirname, 'tmp-benchmark-document.txt');

const CITIZEN = {
  name: 'Benchmark Citizen',
  email: 'benchmarkcitizen@gmail.com',
  password: 'test1234',
  role: 'citizen',
};

const OFFICER = {
  name: 'Benchmark Officer',
  email: 'benchmarkofficer@gmail.com',
  password: 'test1234',
  role: 'officer',
};

// Measure duration of async function execution using performance.now()
async function measure(fn) {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;
  return { duration, result };
}

// Ensure test users exist and return valid tokens
async function ensureAuth(user) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: user.email,
      password: user.password,
    });
    return response.data.token;
  } catch (err) {
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
      });
    } catch (regErr) {
      // Ignore if user registration failed (e.g. already exists)
    }
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: user.email,
      password: user.password,
    });
    return response.data.token;
  }
}

async function runBenchmark() {
  console.log('===========================================================');
  console.log('          GovVerify Performance Benchmark Script           ');
  console.log('===========================================================');
  console.log(`Target Base URL: ${BASE_URL}\n`);

  // Setup temporary test file for upload
  await fs.promises.writeFile(TEMP_FILE, 'Benchmark document test content for GridFS upload.', 'utf8');

  try {
    // 1. Initial Authentication Token Setup
    console.log('[1/5] Authenticating test citizen and officer accounts...');
    const citizenToken = await ensureAuth(CITIZEN);
    const officerToken = await ensureAuth(OFFICER);
    console.log('✓ Successfully authenticated test accounts.\n');

    // 2. MEASURE: Auth Login
    console.log('[2/5] Benchmarking Auth Login (5 runs)...');
    const loginTimes = [];
    for (let i = 0; i < 5; i++) {
      const { duration } = await measure(() =>
        axios.post(`${BASE_URL}/auth/login`, {
          email: CITIZEN.email,
          password: CITIZEN.password,
        })
      );
      loginTimes.push(duration);
    }
    const loginMin = Math.min(...loginTimes);
    const loginMax = Math.max(...loginTimes);
    const loginAvg = loginTimes.reduce((a, b) => a + b, 0) / loginTimes.length;
    console.log(`✓ Auth Login -> Avg: ${loginAvg.toFixed(2)} ms (Min: ${loginMin.toFixed(2)} ms, Max: ${loginMax.toFixed(2)} ms)\n`);

    // 3. MEASURE: Application Submission (with file upload)
    console.log('[3/5] Benchmarking Application Submissions (5 sequential submissions)...');
    const submitTimes = [];
    const createdApps = [];
    for (let i = 0; i < 5; i++) {
      const form = new FormData();
      form.append('certificateType', 'income');
      form.append('details', `Performance benchmark submission #${i + 1}`);
      form.append('documents', fs.createReadStream(TEMP_FILE));

      const { duration, result } = await measure(() =>
        axios.post(`${BASE_URL}/applications`, form, {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${citizenToken}`,
          },
        })
      );
      submitTimes.push(duration);
      createdApps.push(result.data);
    }
    const submitAvg = submitTimes.reduce((a, b) => a + b, 0) / submitTimes.length;
    console.log(`✓ Application Submission -> Avg: ${submitAvg.toFixed(2)} ms across 5 uploads\n`);

    // 4. MEASURE: Application Fetch/List
    console.log('[4/5] Benchmarking Application Fetch/List endpoints (5 runs each)...');
    const fetchMyTimes = [];
    for (let i = 0; i < 5; i++) {
      const { duration } = await measure(() =>
        axios.get(`${BASE_URL}/applications/my`, {
          headers: { Authorization: `Bearer ${citizenToken}` },
        })
      );
      fetchMyTimes.push(duration);
    }
    const fetchMyAvg = fetchMyTimes.reduce((a, b) => a + b, 0) / fetchMyTimes.length;

    const fetchOfficerTimes = [];
    for (let i = 0; i < 5; i++) {
      const { duration } = await measure(() =>
        axios.get(`${BASE_URL}/applications/officer/all`, {
          headers: { Authorization: `Bearer ${officerToken}` },
        })
      );
      fetchOfficerTimes.push(duration);
    }
    const fetchOfficerAvg = fetchOfficerTimes.reduce((a, b) => a + b, 0) / fetchOfficerTimes.length;

    console.log(`✓ GET /applications/my -> Avg: ${fetchMyAvg.toFixed(2)} ms`);
    console.log(`✓ GET /applications/officer/all -> Avg: ${fetchOfficerAvg.toFixed(2)} ms\n`);

    // 5. MEASURE: Blockchain Operations
    console.log('[5/5] Benchmarking Blockchain Operations (Headline numbers)...');
    const targetApp = createdApps[0];
    console.log(`  -> Approving application ID ${targetApp._id} on Ethereum blockchain...`);

    const { duration: approvalTime, result: approvalRes } = await measure(() =>
      axios.patch(
        `${BASE_URL}/applications/${targetApp._id}/review`,
        { decision: 'approved', remarks: 'Approved by benchmark script' },
        { headers: { Authorization: `Bearer ${officerToken}` } }
      )
    );
    console.log(`✓ Blockchain Approval & Issuance -> Time: ${approvalTime.toFixed(2)} ms (${(approvalTime / 1000).toFixed(2)} s)`);

    const refId = approvalRes.data.referenceId || targetApp.referenceId;
    console.log(`  -> Verifying certificate ${refId} (3 runs)...`);

    const verifyTimes = [];
    for (let i = 0; i < 3; i++) {
      const { duration } = await measure(() =>
        axios.get(`${BASE_URL}/applications/verify/${refId}`)
      );
      verifyTimes.push(duration);
    }
    const verifyAvg = verifyTimes.reduce((a, b) => a + b, 0) / verifyTimes.length;
    console.log(`✓ Public Verification Endpoint -> Avg: ${verifyAvg.toFixed(2)} ms\n`);

    // Construct final JSON report
    const benchmarkData = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      results: [
        {
          operation: 'Auth Login (POST /auth/login)',
          runs: 5,
          avgTimeMs: Number(loginAvg.toFixed(2)),
          minTimeMs: Number(loginMin.toFixed(2)),
          maxTimeMs: Number(loginMax.toFixed(2)),
          blockchainDependent: false,
          notes: 'Standard JWT login',
        },
        {
          operation: 'Application Submit + GridFS Upload',
          runs: 5,
          avgTimeMs: Number(submitAvg.toFixed(2)),
          blockchainDependent: false,
          notes: 'Includes file stream upload to MongoDB GridFS',
        },
        {
          operation: 'Fetch Citizen Apps (GET /applications/my)',
          runs: 5,
          avgTimeMs: Number(fetchMyAvg.toFixed(2)),
          blockchainDependent: false,
          notes: 'Filtered list by authenticated user ID',
        },
        {
          operation: 'Fetch Officer Apps (GET /applications/officer/all)',
          runs: 5,
          avgTimeMs: Number(fetchOfficerAvg.toFixed(2)),
          blockchainDependent: false,
          notes: 'Heavy query returning all applications with populated user details',
        },
        {
          operation: 'Blockchain Approval & Write (PATCH /applications/:id/review)',
          runs: 1,
          avgTimeMs: Number(approvalTime.toFixed(2)),
          blockchainDependent: true,
          notes: 'Includes Smart Contract execution & transaction receipt confirmation',
        },
        {
          operation: 'Public Verification & Blockchain Read (GET /applications/verify/:refId)',
          runs: 3,
          avgTimeMs: Number(verifyAvg.toFixed(2)),
          blockchainDependent: true,
          notes: 'Includes hash lookup & verification on-chain',
        },
      ],
    };

    // Write JSON output file
    await fs.promises.writeFile(RESULTS_FILE, JSON.stringify(benchmarkData, null, 2), 'utf8');
    console.log(`Saved benchmark results to ${RESULTS_FILE}\n`);

    // Printed Summary Table
    console.log('========================================================================================');
    console.log('                               BENCHMARK SUMMARY TABLE                                 ');
    console.log('========================================================================================');
    console.table(
      benchmarkData.results.map((row) => ({
        Operation: row.operation,
        'Avg Time (ms)': `${row.avgTimeMs} ms`,
        'Blockchain?': row.blockchainDependent ? 'YES (Slow)' : 'No',
        Runs: row.runs,
        Notes: row.notes,
      }))
    );
    console.log('========================================================================================\n');
  } catch (err) {
    console.error('Benchmark execution error:', err.response?.data || err.message);
    process.exitCode = 1;
  } finally {
    // Cleanup temporary test file
    try {
      if (fs.existsSync(TEMP_FILE)) {
        await fs.promises.unlink(TEMP_FILE);
      }
    } catch (cleanupErr) {
      // Ignore cleanup error
    }
  }
}

runBenchmark();
