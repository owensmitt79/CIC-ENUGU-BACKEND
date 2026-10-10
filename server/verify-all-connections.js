import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5050';

async function verifyAllConnections() {
  console.log('========================================================');
  console.log('🔍 INITIATING DEEP END-TO-END SYSTEM CONNECTION AUDIT');
  console.log(`📡 Target Backend URL: ${BASE_URL}`);
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function report(name, isSuccess, details = '') {
    if (isSuccess) {
      console.log(`✅ [PASS] ${name}${details ? ` -> ${details}` : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  // 1. HTTP Server & Health Check Connection
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    report('HTTP Server & Health Check', res.ok && data.status === 'healthy', `Status: ${data.status}, Database: ${data.database}, Uptime: ${Math.round(data.uptime)}s`);
  } catch (err) {
    report('HTTP Server & Health Check', false, err.message);
  }

  // 2. API Root Gateway
  try {
    const res = await fetch(`${BASE_URL}/api`);
    const data = await res.json();
    report('REST API Root Gateway', res.ok && data.status === 'online', `Set: ${data.set}, Version: ${data.version}`);
  } catch (err) {
    report('REST API Root Gateway', false, err.message);
  }

  // 3. Database Connection: Categories
  try {
    const res = await fetch(`${BASE_URL}/api/categories`);
    const data = await res.json();
    report('Database: Dues Categories', res.ok && Array.isArray(data.data), `${data.count} categories active in database`);
  } catch (err) {
    report('Database: Dues Categories', false, err.message);
  }

  // 4. Database Connection: Leadership Council
  try {
    const res = await fetch(`${BASE_URL}/api/leadership`);
    const data = await res.json();
    report('Database: Leadership Council', res.ok && Array.isArray(data.data), `${data.count} executive council profiles loaded`);
  } catch (err) {
    report('Database: Leadership Council', false, err.message);
  }

  // 5. Database Connection: Capital Projects
  try {
    const res = await fetch(`${BASE_URL}/api/projects`);
    const data = await res.json();
    const hasMath = data.data?.[0]?.percentComplete !== undefined;
    report('Database: Capital Projects', res.ok && hasMath, `${data.count} initiatives (Progress % calculated)`);
  } catch (err) {
    report('Database: Capital Projects', false, err.message);
  }

  // 6. Database Connection: Alumni Members Directory
  try {
    const res = await fetch(`${BASE_URL}/api/members`);
    const data = await res.json();
    report('Database: Alumni Directory', res.ok && Array.isArray(data.data), `${data.data?.length} members retrieved`);
  } catch (err) {
    report('Database: Alumni Directory', false, err.message);
  }

  // 7. System Configuration & Bank Account
  try {
    const res = await fetch(`${BASE_URL}/api/config`);
    const data = await res.json();
    const isOk = res.ok && data.data?.bankAccount?.accountNumber;
    report('System Settings & Rates', isOk, `Assoc: "${data.data?.associationName}", Bank: ${data.data?.bankAccount?.bankName} (${data.data?.bankAccount?.accountNumber})`);
  } catch (err) {
    report('System Settings & Rates', false, err.message);
  }

  // 8. SuperAdmin Authentication (Bcrypt + JWT)
  let authToken = '';
  let authCookie = '';
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cicalumni1995.org',
        password: 'cicEnuguAdmin1995!'
      })
    });
    const data = await res.json();
    authCookie = res.headers.get('set-cookie') || '';
    authToken = data.token;
    report('Authentication: Admin Login', res.ok && data.success, `Role: ${data.user?.role}, HttpOnly Cookie issued: ${Boolean(authCookie || authToken)}`);
  } catch (err) {
    report('Authentication: Admin Login', false, err.message);
  }

  // 9. Authenticated Guard /me (JWT verification)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const data = await res.json();
    report('Authentication: JWT Verification Guard', res.ok && data.user?.email === 'admin@cicalumni1995.org', `Verified identity: ${data.user?.name}`);
  } catch (err) {
    report('Authentication: JWT Verification Guard', false, err.message);
  }

  // 10. Zero-Login Payment Checkout Engine (Paystack Mock/Online)
  let testRef = '';
  let testReceipt = '';
  try {
    const res = await fetch(`${BASE_URL}/api/payments/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Chidi Nwosu',
        email: 'chidi.nwosu@sample.com',
        phone: '+234 803 222 3344',
        paymentType: 'Monthly Dues',
        selectedMonths: ['April', 'May'],
        amount: 10000,
        gateway: 'Paystack',
        channel: 'Debit Card'
      })
    });
    const data = await res.json();
    testRef = data.reference;
    testReceipt = data.receiptNumber;
    const hasQr = Boolean(data.payment?.receiptQrCode);
    report('Payment Engine: Zero-Login Checkout', res.ok && Boolean(testRef), `Ref: ${testRef}, Serial: ${testReceipt}, QR Generated: ${hasQr}`);
  } catch (err) {
    report('Payment Engine: Zero-Login Checkout', false, err.message);
  }

  // 11. Public Digital Verification Engine (verify.html engine)
  try {
    const res = await fetch(`${BASE_URL}/api/payments/verify-lookup/${testRef}`);
    const data = await res.json();
    const verified = res.ok && data.verified === true;
    report('Public Verification Engine (verify.html)', verified, `Lookup for ${testRef} -> Authentic: ${data.verified}, Payer: ${data.data?.name}`);
  } catch (err) {
    report('Public Verification Engine (verify.html)', false, err.message);
  }

  // 12. Digital Receipt Retrieval
  try {
    const res = await fetch(`${BASE_URL}/api/payments/receipt/${testRef}`);
    const data = await res.json();
    report('Digital Receipt Generator', res.ok && Boolean(data.receipt?.securityHash), `Security Hash: ${data.receipt?.securityHash?.substring(0, 16)}...`);
  } catch (err) {
    report('Digital Receipt Generator', false, err.message);
  }

  // 13. Secretariat Manual Offline Receipt Studio
  try {
    const res = await fetch(`${BASE_URL}/api/payments/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: 'Engr. Nnamdi Kanu',
        email: 'nnamdi.kanu@sample.com',
        phone: '+44 791 234 5678',
        paymentType: 'Development Levy',
        amount: 50000,
        channel: 'Bank Transfer',
        notes: 'National bank wire transfer received'
      })
    });
    const data = await res.json();
    report('Secretariat Offline Manual Receipt Studio', res.ok && data.success, `Manual Ref: ${data.payment?.reference}, Status: ${data.payment?.status}`);
  } catch (err) {
    report('Secretariat Offline Manual Receipt Studio', false, err.message);
  }

  // 14. Financial Accounting Ledger
  try {
    const res = await fetch(`${BASE_URL}/api/payments`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const data = await res.json();
    report('Financial Accounting Ledger', res.ok && Array.isArray(data.data), `${data.pagination?.total || data.data?.length} transactions in accounting ledger`);
  } catch (err) {
    report('Financial Accounting Ledger', false, err.message);
  }

  // 15. Ledger CSV Export Connection
  try {
    const res = await fetch(`${BASE_URL}/api/payments/export/csv`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const csv = await res.text();
    const hasHeaders = csv.includes('Reference') && csv.includes('Amount');
    report('Financial Ledger CSV Export', res.ok && hasHeaders, `Generated ${csv.split('\n').length} CSV lines`);
  } catch (err) {
    report('Financial Ledger CSV Export', false, err.message);
  }

  // 16. Executive Dashboard KPIs & Analytics
  try {
    const res = await fetch(`${BASE_URL}/api/reports/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const data = await res.json();
    const kpis = data.data?.kpis;
    report('Executive Analytics & KPIs', res.ok && Boolean(kpis), `Revenue: ₦${kpis?.totalRevenue?.toLocaleString()}, Transactions: ${kpis?.totalTransactions}`);
  } catch (err) {
    report('Executive Analytics & KPIs', false, err.message);
  }

  // 17. Static Frontend Asset Serving
  try {
    const res = await fetch(`${BASE_URL}/index.html`);
    const text = await res.text();
    const servesFrontend = res.ok && text.includes('CIC Alumni');
    report('Static Frontend Asset Server', servesFrontend, `Serving index.html directly from Node.js (HTTP ${res.status})`);
  } catch (err) {
    report('Static Frontend Asset Server', false, err.message);
  }

  console.log('\n========================================================');
  console.log(`📊 AUDIT RESULT: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  if (failed === 0) {
    console.log('🎉 ALL SYSTEM CONNECTIONS ARE 100% OPERATIONAL & VERIFIED!');
  } else {
    console.error(`⚠️ ${failed} connection(s) encountered issues.`);
  }
  console.log('========================================================\n');
}

verifyAllConnections();
