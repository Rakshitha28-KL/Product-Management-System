/**
 * Automated Advanced Stock Management Test Suite
 * Tests: Thresholds, Alerts, Stock History, Increments/Decrements, Validation, and RBAC
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

const runStockTests = async () => {
  console.log('\n======================================================');
  console.log('   STARTING ADVANCED STOCK MANAGEMENT TEST SUITE');
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
    const adminEmail = `stock_admin_${Date.now()}@example.com`;

    // 1. Register Admin
    const regAdmin = await request('POST', '/api/auth/register', {
      name: 'Stock Administrator',
      email: adminEmail,
      password: 'AdminPassword123',
      confirmPassword: 'AdminPassword123',
      role: 'admin',
    });
    const token = regAdmin.body?.data?.token;

    // 2. Create product with initial stock = 10 and minStockThreshold = 4
    console.log('\n--- 1. Product Creation with Threshold & Initial Stock ---');
    const createRes = await request('POST', '/api/products', {
      name: 'Stock Testing Ergonomic Mouse',
      category: 'Electronics',
      price: 59.99,
      stockQuantity: 10,
      minStockThreshold: 4,
      description: 'Precision wireless optical mouse for stock testing.',
    }, token);
    assert('Product created with initial stock of 10 and threshold 4', createRes.status === 201 && createRes.body.data?.stockStatus === 'In Stock');
    const prodId = createRes.body.data?._id;

    // 3. Stock Increase (Restock +15 -> 25)
    console.log('\n--- 2. Stock Increase (Restock) ---');
    const restockRes = await request('POST', `/api/products/${prodId}/stock`, {
      newQuantity: 25,
      reason: 'Restock',
      changeType: 'RESTOCK',
      note: 'Supplier shipment batch #4401',
    }, token);
    assert('Stock increased to 25 units (200 OK)', restockRes.status === 200 && restockRes.body.data?.product?.stockQuantity === 25);
    assert('Stock history recorded changeAmount of +15', restockRes.body.data?.stockHistory?.changeAmount === 15);
    assert('Stock history recorded changeType RESTOCK', restockRes.body.data?.stockHistory?.changeType === 'RESTOCK');

    // 4. Stock Decrease (Sale -21 -> 4 units -> triggers Low Stock)
    console.log('\n--- 3. Stock Decrease (Sale -> Low Stock) ---');
    const saleRes = await request('POST', `/api/products/${prodId}/stock`, {
      newQuantity: 4,
      reason: 'Sale',
      changeType: 'SALE',
      note: 'Bulk corporate order',
    }, token);
    assert('Stock decreased from 25 to 4 units (200 OK)', saleRes.status === 200 && saleRes.body.data?.product?.stockQuantity === 4);
    assert('Product status automatically transitioned to "Low Stock"', saleRes.body.data?.product?.stockStatus === 'Low Stock');
    assert('Stock history recorded changeAmount of -21', saleRes.body.data?.stockHistory?.changeAmount === -21);

    // 5. Stock Depletion (Damage/Sale -> 0 units -> triggers Out of Stock)
    console.log('\n--- 4. Stock Depletion (Zero Units -> Out of Stock) ---');
    const outRes = await request('POST', `/api/products/${prodId}/stock`, {
      newQuantity: 0,
      reason: 'Damaged',
      changeType: 'DAMAGED',
      note: 'Water damage in warehouse aisle 3',
    }, token);
    assert('Stock decreased to 0 units (200 OK)', outRes.status === 200 && outRes.body.data?.product?.stockQuantity === 0);
    assert('Product status automatically transitioned to "Out of Stock"', outRes.body.data?.product?.stockStatus === 'Out of Stock');

    // 6. Validation Errors: Negative quantity & Missing reason
    console.log('\n--- 5. Stock Validation Checks ---');
    const negRes = await request('POST', `/api/products/${prodId}/stock`, {
      newQuantity: -5,
      reason: 'Restock',
    }, token);
    assert('Negative stock quantity rejected with 400 Bad Request', negRes.status === 400 && negRes.body.success === false);

    const noReasonRes = await request('POST', `/api/products/${prodId}/stock`, {
      newQuantity: 10,
      reason: '',
    }, token);
    assert('Missing adjustment reason rejected with 400 Bad Request', noReasonRes.status === 400 && noReasonRes.body.success === false);

    // 7. Product Stock History Retrieval
    console.log('\n--- 6. Stock Movement History Retrieval ---');
    const historyRes = await request('GET', `/api/products/${prodId}/stock-history`, null, token);
    assert('Stock history endpoint returns 200', historyRes.status === 200 && Array.isArray(historyRes.body.data));
    assert('Stock history contains 4 entries (Initial + Restock + Sale + Damaged)', historyRes.body.data?.length >= 4);

    // 8. Low Stock Alerts on Dashboard Stats
    console.log('\n--- 7. Low Stock Alerts Verification ---');
    const statsRes = await request('GET', '/api/products/stats', null, token);
    assert('Dashboard stats endpoint returns 200', statsRes.status === 200);
    const alerts = statsRes.body.data?.lowStockAlerts || [];
    assert('Dashboard returns lowStockAlerts array', Array.isArray(alerts));
    const targetAlert = alerts.find((a) => String(a.id) === String(prodId));
    assert('Alert detected for depleted item ("... is out of stock")', !!targetAlert && targetAlert.type === 'OUT_OF_STOCK');

    // 9. Unauthenticated Protection
    console.log('\n--- 8. Security & Authentication ---');
    const unauthStockReq = await request('POST', `/api/products/${prodId}/stock`, {
      newQuantity: 10,
      reason: 'Manual Adjustment',
    });
    assert('Unauthenticated stock adjustment rejected with 401', unauthStockReq.status === 401);

    // Summary
    console.log('\n======================================================');
    console.log(`   STOCK MANAGEMENT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Unexpected stock test error:', err);
    process.exit(1);
  }
};

runStockTests();
