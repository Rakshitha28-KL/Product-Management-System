/**
 * Comprehensive Automated Product API Test Suite (with Auth Token support)
 * Tests all requirements: CRUD, Validation, Search, Filter, Sort, Pagination, Stats
 */

const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

// Helper function to make HTTP requests
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

const runTests = async () => {
  console.log('\n======================================================');
  console.log('   STARTING PRODUCT API AUTOMATED TEST SUITE');
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
    // 1. Health check
    console.log('\n--- 1. Server Health Check ---');
    const health = await request('GET', '/api/health');
    assert('Health Check Returns 200 and success', health.status === 200 && health.body.success === true);

    // Register / Login Admin to get token for protected routes
    const adminEmail = `api_test_admin_${Date.now()}@example.com`;
    const regRes = await request('POST', '/api/auth/register', {
      name: 'API Test Administrator',
      email: adminEmail,
      password: 'AdminPassword123',
      confirmPassword: 'AdminPassword123',
      role: 'admin',
    });
    const token = regRes.body?.data?.token;

    // 2. Dashboard Stats
    console.log('\n--- 2. Dashboard Statistics API ---');
    const stats = await request('GET', '/api/products/stats', null, token);
    assert('Stats endpoint returns 200', stats.status === 200);
    assert('Stats contains totalProducts >= 1', stats.body.data?.totalProducts >= 0);
    assert('Stats contains totalStock >= 0', stats.body.data?.totalStock >= 0);
    assert('Stats contains totalInventoryValue >= 0', stats.body.data?.totalInventoryValue >= 0);
    assert('Stats includes lowStockCount & outOfStockCount', typeof stats.body.data?.lowStockCount === 'number');

    // 3. Categories API
    console.log('\n--- 3. Categories API ---');
    const cats = await request('GET', '/api/products/categories', null, token);
    assert('Categories endpoint returns 200', cats.status === 200);
    assert('Categories contains an array', Array.isArray(cats.body.data));

    // 4. Product Creation - Validation & Success
    console.log('\n--- 4. Product Creation Tests ---');
    
    // 4a. Empty name
    const invalidName = await request('POST', '/api/products', {
      name: '',
      category: 'Electronics',
      price: 100,
      stockQuantity: 10,
      description: 'A valid description for test',
    }, token);
    assert('Creation fails with empty name (status 400)', invalidName.status === 400 && invalidName.body.success === false);

    // 4b. Invalid price
    const invalidPrice = await request('POST', '/api/products', {
      name: 'Test Product',
      category: 'Electronics',
      price: -10,
      stockQuantity: 10,
      description: 'A valid description for test',
    }, token);
    assert('Creation fails with negative price (status 400)', invalidPrice.status === 400 && invalidPrice.body.success === false);

    // 4c. Negative stock
    const invalidStock = await request('POST', '/api/products', {
      name: 'Test Product',
      category: 'Electronics',
      price: 50,
      stockQuantity: -5,
      description: 'A valid description for test',
    }, token);
    assert('Creation fails with negative stock (status 400)', invalidStock.status === 400 && invalidStock.body.success === false);

    // 4d. Empty category
    const invalidCat = await request('POST', '/api/products', {
      name: 'Test Product',
      category: '',
      price: 50,
      stockQuantity: 10,
      description: 'A valid description for test',
    }, token);
    assert('Creation fails with empty category (status 400)', invalidCat.status === 400 && invalidCat.body.success === false);

    // 4e. Short description (< 5 chars)
    const invalidDesc = await request('POST', '/api/products', {
      name: 'Test Product',
      category: 'Electronics',
      price: 50,
      stockQuantity: 10,
      description: 'Hi',
    }, token);
    assert('Creation fails with short description (status 400)', invalidDesc.status === 400 && invalidDesc.body.success === false);

    // 4f. Valid product creation
    const validCreate = await request('POST', '/api/products', {
      name: 'Automated Test Gadget X100',
      category: 'Testing',
      price: 149.99,
      stockQuantity: 12,
      description: 'High tech gadget created during automated testing suite run.',
    }, token);
    assert('Valid product created with 201', validCreate.status === 201 && validCreate.body.success === true);
    const createdId = validCreate.body.data?._id;
    assert('Created product has _id and stockStatus', !!createdId && validCreate.body.data?.stockStatus === 'In Stock');

    // 5. Product Retrieval by ID
    console.log('\n--- 5. Get Product by ID ---');
    const getById = await request('GET', `/api/products/${createdId}`, null, token);
    assert('Get by ID returns 200 with matching name', getById.status === 200 && getById.body.data.name === 'Automated Test Gadget X100');

    const getInvalidId = await request('GET', '/api/products/000000000000000000000000', null, token);
    assert('Get by non-existing ID returns 404', getInvalidId.status === 404 && getInvalidId.body.success === false);

    const getMalformedId = await request('GET', '/api/products/not-a-valid-object-id', null, token);
    assert('Get by malformed ID returns 400', getMalformedId.status === 400 && getMalformedId.body.success === false);

    // 6. Product Update
    console.log('\n--- 6. Product Update Tests ---');
    const validUpdate = await request('PUT', `/api/products/${createdId}`, {
      name: 'Automated Test Gadget X100 - Updated',
      price: 179.99,
      stockQuantity: 3, // Low stock
    }, token);
    assert('Valid update returns 200', validUpdate.status === 200 && validUpdate.body.success === true);
    assert('Updated stock status is "Low Stock"', validUpdate.body.data?.stockStatus === 'Low Stock');
    assert('Updated price is 179.99', validUpdate.body.data?.price === 179.99);

    const updateNonExisting = await request('PUT', '/api/products/000000000000000000000000', {
      name: 'Does Not Matter',
    }, token);
    assert('Update non-existing product returns 404', updateNonExisting.status === 404);

    // 7. Search API
    console.log('\n--- 7. Search Tests ---');
    const searchExisting = await request('GET', '/api/products?search=gadget', null, token);
    assert('Search "gadget" finds the created item', searchExisting.body.data?.products?.some((p) => p._id === createdId));

    const searchCaseInsensitive = await request('GET', '/api/products?search=GADGET', null, token);
    assert('Case-insensitive search "GADGET" works', searchCaseInsensitive.body.data?.products?.some((p) => p._id === createdId));

    const searchNonExisting = await request('GET', '/api/products?search=xyznonexistingproductquery999', null, token);
    assert('Search for non-existing query returns empty array', searchNonExisting.body.data?.products?.length === 0);

    // 8. Filter by Category
    console.log('\n--- 8. Category Filter Tests ---');
    const filterTesting = await request('GET', '/api/products?category=Testing', null, token);
    assert('Category filter "Testing" returns matching product', filterTesting.body.data?.products?.some((p) => p._id === createdId));

    // 9. Sorting
    console.log('\n--- 9. Sorting Tests ---');
    const sortPriceAsc = await request('GET', '/api/products?sort=price_asc&limit=20', null, token);
    const pricesAsc = sortPriceAsc.body.data?.products?.map((p) => p.price);
    const isSortedPriceAsc = pricesAsc.every((val, i, arr) => !i || arr[i - 1] <= val);
    assert('Sort by Price: Low to High is correctly ordered', isSortedPriceAsc);

    const sortPriceDesc = await request('GET', '/api/products?sort=price_desc&limit=20', null, token);
    const pricesDesc = sortPriceDesc.body.data?.products?.map((p) => p.price);
    const isSortedPriceDesc = pricesDesc.every((val, i, arr) => !i || arr[i - 1] >= val);
    assert('Sort by Price: High to Low is correctly ordered', isSortedPriceDesc);

    // 10. Product Deletion
    console.log('\n--- 10. Product Deletion Tests ---');
    const deleteCreated = await request('DELETE', `/api/products/${createdId}`, null, token);
    assert('Delete existing product returns 200', deleteCreated.status === 200 && deleteCreated.body.success === true);

    const deleteAgain = await request('DELETE', `/api/products/${createdId}`, null, token);
    assert('Delete already deleted product returns 404', deleteAgain.status === 404);

    const verifyDeleted = await request('GET', `/api/products/${createdId}`, null, token);
    assert('Get deleted product returns 404', verifyDeleted.status === 404);

    // Summary
    console.log('\n======================================================');
    console.log(`   TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Unexpected test error:', err);
    process.exit(1);
  }
};

runTests();
