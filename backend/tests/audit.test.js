/**
 * Automated Audit Log Test Suite
 * Validates automatic audit tracking across Product & Auth actions and RBAC permissions
 */

const http = require('http');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method.toUpperCase(),
      headers,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runAuditTests = async () => {
  console.log('\n======================================================');
  console.log('   STARTING AUDIT LOG AUTOMATED TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (name, condition, extraInfo = '') => {
    if (condition) {
      console.log(` \x1b[32m✔ PASS\x1b[0m: ${name}`);
      passed++;
    } else {
      console.error(` \x1b[31m✖ FAIL\x1b[0m: ${name} ${extraInfo ? `(${extraInfo})` : ''}`);
      failed++;
    }
  };

  try {
    const adminEmail = `audit_admin_${Date.now()}@example.com`;
    const staffEmail = `audit_staff_${Date.now()}@example.com`;

    // 1. Register Admin & Staff
    console.log('\n--- 1. User Registration & Login Audit Verification ---');
    const regAdmin = await request('POST', '/api/auth/register', {
      name: 'Audit Administrator',
      email: adminEmail,
      password: 'AdminPassword123',
      confirmPassword: 'AdminPassword123',
      role: 'admin',
    });
    const adminToken = regAdmin.body.data?.token;

    const regStaff = await request('POST', '/api/auth/register', {
      name: 'Audit Staff Member',
      email: staffEmail,
      password: 'StaffPassword123',
      confirmPassword: 'StaffPassword123',
      role: 'staff',
    });
    const staffToken = regStaff.body.data?.token;

    // Login Admin to generate login audit event
    const loginRes = await request('POST', '/api/auth/login', {
      email: adminEmail,
      password: 'AdminPassword123',
    });
    assert('Admin login successful (200)', loginRes.status === 200);

    // 2. Staff Access Control on Audit Logs API (Must be 403 Forbidden)
    console.log('\n--- 2. RBAC Access Control on Audit Logs ---');
    const staffAuditReq = await request('GET', '/api/audit-logs', null, staffToken);
    assert('Staff accessing /api/audit-logs receives HTTP 403 Forbidden', staffAuditReq.status === 403 && staffAuditReq.body.success === false);

    const unauthAuditReq = await request('GET', '/api/audit-logs');
    assert('Unauthenticated access to /api/audit-logs receives HTTP 401', unauthAuditReq.status === 401);

    // 3. Admin Access on Audit Logs API
    const adminAuditReq = await request('GET', '/api/audit-logs', null, adminToken);
    assert('Admin can access /api/audit-logs (HTTP 200)', adminAuditReq.status === 200 && adminAuditReq.body.success === true);

    const hasRegisterLog = adminAuditReq.body.data?.logs?.some((l) => l.action === 'USER_REGISTER');
    assert('Audit log contains USER_REGISTER event', hasRegisterLog);

    const hasLoginLog = adminAuditReq.body.data?.logs?.some((l) => l.action === 'USER_LOGIN');
    assert('Audit log contains USER_LOGIN event', hasLoginLog);

    // 4. Product Creation Audit Log
    console.log('\n--- 3. Product Action Audit Verification ---');
    const createProd = await request('POST', '/api/products', {
      name: 'Audit Tested Smart Drone',
      category: 'Electronics',
      price: 899.00,
      stockQuantity: 10,
      description: 'Autonomous 4K camera drone with obstacle avoidance.',
    }, adminToken);
    assert('Product created (201)', createProd.status === 201);
    const prodId = createProd.body.data?._id;

    // Verify create audit log
    const logsAfterCreate = await request('GET', `/api/audit-logs?search=Drone`, null, adminToken);
    const createLog = logsAfterCreate.body.data?.logs?.find((l) => l.action === 'PRODUCT_CREATE' && l.entityId === prodId);
    assert('PRODUCT_CREATE log exists with entityId and description', !!createLog && createLog.description.includes('Audit Tested Smart Drone'));
    assert('PRODUCT_CREATE log contains newData snapshot', createLog?.newData?.name === 'Audit Tested Smart Drone');

    // 5. Product Update & Stock Change Audit Log
    const updateProd = await request('PUT', `/api/products/${prodId}`, {
      stockQuantity: 25, // Stock changed from 10 to 25
      price: 849.00,
    }, adminToken);
    assert('Product updated (200)', updateProd.status === 200);

    // Verify update audit log
    const logsAfterUpdate = await request('GET', `/api/audit-logs?search=Drone`, null, adminToken);
    const updateLog = logsAfterUpdate.body.data?.logs?.find((l) => l.action === 'PRODUCT_UPDATE' && l.entityId === prodId);
    assert('PRODUCT_UPDATE log records oldData and newData', !!updateLog && updateLog.oldData?.stockQuantity === 10 && updateLog.newData?.stockQuantity === 25);
    assert('PRODUCT_UPDATE log description captures stock and price changes', updateLog?.description.includes('stock changed from 10 to 25'));

    // 6. Product Deletion Audit Log
    const deleteProd = await request('DELETE', `/api/products/${prodId}`, null, adminToken);
    assert('Product deleted (200)', deleteProd.status === 200);

    // Verify delete audit log
    const logsAfterDelete = await request('GET', `/api/audit-logs?action=PRODUCT_DELETE`, null, adminToken);
    const deleteLog = logsAfterDelete.body.data?.logs?.find((l) => l.entityId === prodId);
    assert('PRODUCT_DELETE log exists with oldData snapshot', !!deleteLog && deleteLog.oldData?.name === 'Audit Tested Smart Drone');

    // 7. Audit Log Stats API
    console.log('\n--- 4. Audit Log Statistics API ---');
    const statsRes = await request('GET', '/api/audit-logs/stats', null, adminToken);
    assert('Audit stats endpoint returns 200', statsRes.status === 200);
    assert('Stats includes totalLogs >= 5', statsRes.body.data?.totalLogs >= 5);
    assert('Stats includes actionBreakdown array', Array.isArray(statsRes.body.data?.actionBreakdown));

    // Summary
    console.log('\n======================================================');
    console.log(`   AUDIT LOG TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Unexpected audit test error:', err);
    process.exit(1);
  }
};

runAuditTests();
