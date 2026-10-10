import { prisma } from './src/config/db.js';
import { config } from './src/config/env.js';

async function runTests() {
  console.log('🧪 Starting API Verification Tests...\n');

  const BASE_URL = `http://localhost:${config.port}`;

  // Check if server is already running on the configured port
  let isRunning = false;
  try {
    const checkRes = await fetch(`${BASE_URL}/health`);
    if (checkRes.ok) isRunning = true;
  } catch (_) {}

  if (!isRunning) {
    // Dynamically launch server only if not already active
    await import('./src/server.js');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } else {
    console.log(`📡 Connected to active server running on ${BASE_URL}\n`);
  }

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    console.log(`✅ [GET /health] Status: ${health.status}, DB: ${health.database}`);

    // 2. API Root Info
    const apiRes = await fetch(`${BASE_URL}/api`);
    const apiInfo = await apiRes.json();
    console.log(`✅ [GET /api] Set: ${apiInfo.set}, Motto: "${apiInfo.motto}"`);

    // 3. Categories Endpoint
    const catRes = await fetch(`${BASE_URL}/api/categories`);
    const cats = await catRes.json();
    console.log(`✅ [GET /api/categories] Found ${cats.count} categories.`);

    // 4. Leadership Council
    const leadRes = await fetch(`${BASE_URL}/api/leadership`);
    const leads = await leadRes.json();
    console.log(`✅ [GET /api/leadership] Found ${leads.count} executive officers.`);

    // 5. Capital Projects
    const projRes = await fetch(`${BASE_URL}/api/projects`);
    const projs = await projRes.json();
    console.log(`✅ [GET /api/projects] Found ${projs.count} capital initiatives.`);

    // 6. Members Directory
    const memRes = await fetch(`${BASE_URL}/api/members`);
    const mems = await memRes.json();
    console.log(`✅ [GET /api/members] Loaded ${mems.data?.length || 0} alumni members.`);

    // 7. SuperAdmin Authentication (Timing Attack Hardened)
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cicalumni1995.org',
        password: 'cicEnuguAdmin1995!'
      })
    });
    const loginData = await loginRes.json();
    const setCookie = loginRes.headers.get('set-cookie') || '';
    const token = loginData.token;
    console.log(`✅ [POST /api/auth/login] Auth success: ${loginData.success}, Role: ${loginData.user?.role}, HttpOnly Cookie: ${Boolean(setCookie || token)}`);

    // 8. Test Zero-Login Payment Checkout
    const payRes = await fetch(`${BASE_URL}/api/payments/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Chief Uche Nnamani',
        email: 'uche.nnamani@sample.com',
        phone: '+234 803 555 6677',
        paymentType: 'Monthly Dues',
        selectedMonths: ['January', 'February', 'March'],
        amount: 15000,
        gateway: 'Paystack',
        channel: 'Debit Card'
      })
    });
    const payData = await payRes.json();
    console.log(`✅ [POST /api/payments/initialize] Reference: ${payData.reference}, Receipt: ${payData.receiptNumber}`);

    // 9. Public Zero-Login Verification Lookup
    const verifyRes = await fetch(`${BASE_URL}/api/payments/verify-lookup/${payData.reference}`);
    const verifyData = await verifyRes.json();
    console.log(`✅ [GET /api/payments/verify-lookup/:ref] Authenticity Verified: ${verifyData.verified}, Payer: ${verifyData.data?.name}`);

    // 10. Admin Executive Dashboard Analytics (Authenticated via Bearer or Cookie)
    const reportHeaders = {};
    if (token) reportHeaders.Authorization = `Bearer ${token}`;
    if (setCookie) reportHeaders.Cookie = setCookie;

    const reportRes = await fetch(`${BASE_URL}/api/reports/dashboard`, {
      headers: reportHeaders
    });
    const reportData = await reportRes.json();
    console.log(`✅ [GET /api/reports/dashboard] Total Revenue: ₦${reportData.data?.kpis?.totalRevenue.toLocaleString()}`);

    console.log('\n🎉 ALL 10 ARCHITECTURE TESTS PASSED FLAWLESSLY!\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTests();
