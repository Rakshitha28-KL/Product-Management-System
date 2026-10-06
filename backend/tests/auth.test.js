/**
 * Automated Authentication & Role-Based Access Control Test Suite
 * Tests all 12 security & authorization requirements
 */

const http = require('http');
const mongoose = require('mongoose');
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

const runAuthTests = async () => {
  console.log('\n======================================================');
  console.log('   STARTING AUTH & RBAC AUTOMATED TEST SUITE');
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
    const testAdminEmail = `test_admin_${Date.now()}@example.com`;
    const testStaffEmail = `test_staff_${Date.now()}@example.com`;

    // 1. Valid Registration
    console.log('\n--- 1. User Registration Tests ---');
    const regAdmin = await request('POST', '/api/auth/register', {
      name: 'Test Administrator',
      email: testAdminEmail,
      password: 'SecureAdminPassword123',
      confirmPassword: 'SecureAdminPassword123',
      role: 'admin',
    });
    assert('Admin registered successfully with status 201', regAdmin.status === 201 && regAdmin.body.success === true);
    assert('Registration returns JWT token and user info', !!regAdmin.body.data?.token && regAdmin.body.data?.user?.role === 'admin');

    const adminToken = regAdmin.body.data?.token;

    // 2. Duplicate email rejection
    const dupReg = await request('POST', '/api/auth/register', {
      name: 'Duplicate User',
      email: testAdminEmail,
      password: 'SecurePassword123',
      confirmPassword: 'SecurePassword123',
      role: 'staff',
    });
    assert('Duplicate email registration rejected with 400', dupReg.status === 400 && dupReg.body.success === false);

    // 3. Invalid email format rejection
    const invalidEmailReg = await request('POST', '/api/auth/register', {
      name: 'Bad Email User',
      email: 'not-an-email',
      password: 'SecurePassword123',
      confirmPassword: 'SecurePassword123',
      role: 'staff',
    });
    assert('Invalid email format rejected with 400', invalidEmailReg.status === 400 && invalidEmailReg.body.success === false);

    // 4. Weak password rejection
    const weakPassReg = await request('POST', '/api/auth/register', {
      name: 'Short Pass User',
      email: `short_${Date.now()}@example.com`,
      password: '123',
      confirmPassword: '123',
      role: 'staff',
    });
    assert('Password under 6 chars rejected with 400', weakPassReg.status === 400 && weakPassReg.body.success === false);

    // 5. Password mismatch rejection
    const mismatchReg = await request('POST', '/api/auth/register', {
      name: 'Mismatch User',
      email: `mismatch_${Date.now()}@example.com`,
      password: 'Password123',
      confirmPassword: 'DifferentPassword123',
      role: 'staff',
    });
    assert('Password mismatch rejected with 400', mismatchReg.status === 400 && mismatchReg.body.success === false);

    // Register Staff user
    const regStaff = await request('POST', '/api/auth/register', {
      name: 'Test Staff Member',
      email: testStaffEmail,
      password: 'SecureStaffPassword123',
      confirmPassword: 'SecureStaffPassword123',
      role: 'staff',
    });
    assert('Staff registered successfully with status 201', regStaff.status === 201 && regStaff.body.data?.user?.role === 'staff');
    const staffToken = regStaff.body.data?.token;

    // 6. Valid Login
    console.log('\n--- 2. Login Tests ---');
    const validLogin = await request('POST', '/api/auth/login', {
      email: testAdminEmail,
      password: 'SecureAdminPassword123',
    });
    assert('Valid login returns 200 with JWT token', validLogin.status === 200 && !!validLogin.body.data?.token);

    // 7. Invalid Login (wrong password / wrong email)
    const invalidLoginWrongPass = await request('POST', '/api/auth/login', {
      email: testAdminEmail,
      password: 'WrongPassword!',
    });
    assert('Invalid password returns 401 with generic message', invalidLoginWrongPass.status === 401 && invalidLoginWrongPass.body.message === 'Invalid email or password');

    const invalidLoginWrongEmail = await request('POST', '/api/auth/login', {
      email: 'nonexistent_user_email_999@example.com',
      password: 'SomePassword123',
    });
    assert('Non-existing email returns 401 with generic message', invalidLoginWrongEmail.status === 401 && invalidLoginWrongEmail.body.message === 'Invalid email or password');

    // 8. Protected API access without token
    console.log('\n--- 3. Authentication Middleware Tests ---');
    const unauthGet = await request('GET', '/api/products');
    assert('Unauthenticated request to /api/products returns 401', unauthGet.status === 401 && unauthGet.body.success === false);

    // 9. Invalid / Malformed JWT Token
    const invalidJwtGet = await request('GET', '/api/products', null, 'invalid.jwt.token.string');
    assert('Invalid JWT token rejected with 401', invalidJwtGet.status === 401 && invalidJwtGet.body.success === false);

    // 10. Admin Role Permissions (Full Access)
    console.log('\n--- 4. Role-Based Access Control Tests ---');
    const adminGet = await request('GET', '/api/products', null, adminToken);
    assert('Admin can view products (200)', adminGet.status === 200 && adminGet.body.success === true);

    const adminCreate = await request('POST', '/api/products', {
      name: 'RBAC Admin Test Item',
      category: 'Testing',
      price: 299.99,
      stockQuantity: 15,
      description: 'Product created by Admin during RBAC test suite.',
    }, adminToken);
    assert('Admin can create product (201)', adminCreate.status === 201 && adminCreate.body.success === true);
    const createdProductId = adminCreate.body.data?._id;

    // 11. Staff Role Permissions (Read/Search allowed, DELETE forbidden)
    const staffGet = await request('GET', '/api/products', null, staffToken);
    assert('Staff can view products (200)', staffGet.status === 200 && staffGet.body.success === true);

    const staffSearch = await request('GET', '/api/products?search=RBAC', null, staffToken);
    assert('Staff can search products (200)', staffSearch.status === 200 && staffSearch.body.data?.products?.length > 0);

    // 12. Staff attempting DELETE API (Must return 403 Forbidden)
    const staffDelete = await request('DELETE', `/api/products/${createdProductId}`, null, staffToken);
    assert('Staff attempting DELETE product receives HTTP 403 Forbidden', staffDelete.status === 403 && staffDelete.body.success === false);

    // 13. Admin deletes the test product (Allowed)
    const adminDelete = await request('DELETE', `/api/products/${createdProductId}`, null, adminToken);
    assert('Admin can delete product (200)', adminDelete.status === 200 && adminDelete.body.success === true);

    // Summary
    console.log('\n======================================================');
    console.log(`   AUTH TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Unexpected auth test error:', err);
    process.exit(1);
  }
};

runAuthTests();
