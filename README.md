# Product Management and Inventory System with Advanced Stock Management & Audit Logging

> **A Full-Stack Enterprise-Grade MERN Application for Product & Inventory Management with Configurable Low-Stock Thresholds, Real-Time Alerts, Stock Movement History Tracking, Audit Logging, and JWT Role-Based Access Control (Admin & Staff)**

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![Stack](https://img.shields.io/badge/stack-MERN-green.svg)
![Auth](https://img.shields.io/badge/auth-JWT%20%2B%20Bcrypt-orange.svg)
![RBAC](https://img.shields.io/badge/RBAC-Admin%20%26%20Staff-purple.svg)
![Stock](https://img.shields.io/badge/stock-Dynamic%20Thresholds%20%2B%20History-cyan.svg)
![Audit](https://img.shields.io/badge/audit-MongoDB%20AuditLog-emerald.svg)
![Tests](https://img.shields.io/badge/tests-83%20passed%20(100%25)-brightgreen.svg)

---

## ⚡ Quick Demo Accounts

| Role | Email Address | Password | Permissions Summary |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `Admin@123` | Full access: View, Add, Edit, Delete SKUs, Stock Adjustments, Audit Logs, System Security |
| **Staff** | `staff@example.com` | `Staff@123` | Operational access: View, Search, Filter, Sort, View Details, Stock Adjustments. *(Delete & Audit Logs restricted)* |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Advanced Stock Management Architecture](#2-advanced-stock-management-architecture)
3. [Audit Logging System](#3-audit-logging-system)
4. [Authentication & RBAC Architecture](#4-authentication--rbac-architecture)
5. [Key Features](#5-key-features)
6. [Technology Stack](#6-technology-stack)
7. [Project Structure](#7-project-structure)
8. [Data Models & Schemas](#8-data-models--schemas)
9. [REST API Documentation](#9-rest-api-documentation)
10. [Installation & Setup](#10-installation--setup)
11. [Running the Application](#11-running-the-application)
12. [Automated Testing (83 Tests)](#12-automated-testing)

---

## 1. Project Overview

The **Product Management and Inventory System** is a full-stack web application designed for enterprise cataloging, dynamic valuation, multi-user role-based security, automated low-stock detection, stock movement audit trails, and comprehensive activity logging.

---

## 2. Advanced Stock Management Architecture

### 1. Configurable Minimum Stock Threshold
* Each product maintains a configurable `minStockThreshold` (default `5` units).
* Dynamic status calculation:
  * `0 units` ➔ **OUT OF STOCK**
  * `1 to minStockThreshold` ➔ **LOW STOCK**
  * `> minStockThreshold` ➔ **IN STOCK**

### 2. Real-Time Low Stock & Out-of-Stock Alerts
* The Dashboard automatically evaluates item stocks against their configured thresholds.
* Displays dedicated notification feeds:
  * `"Mouse stock is low. Current stock: 3"`
  * `"Keyboard is out of stock."`
* Includes quick one-click **Restock** triggers to immediately adjust quantities.

### 3. Stock History Collection (`StockHistory`)
* Tracks every stock movement with:
  * `productId`, `productName`, `previousQuantity`, `newQuantity`, `changeAmount` (`+` / `-`), `changeType` (`RESTOCK`, `SALE`, `DAMAGED`, `RETURNED`, `MANUAL_ADJUSTMENT`, `INITIAL_STOCK`), `changedBy`, `reason`, `note`, `timestamp`.

### 4. Product Details Stock Timeline & SVG Chart
* Displays an interactive historical stock table with date, previous stock, new stock, delta badge, action type, user, and reason.
* Includes a responsive SVG stock level trend chart with the item's minimum threshold baseline.

### 5. Dedicated Stock Adjustment Interface
* Interactive stock update modal validating non-negative quantities, required reasons, and delta preview.

---

## 3. Audit Logging System

* Dedicated `AuditLog` collection capturing user and entity events:
  * `USER_REGISTER`, `USER_LOGIN`, `USER_LOGOUT`, `PRODUCT_CREATE`, `PRODUCT_UPDATE`, `STOCK_UPDATE`, `PRODUCT_DELETE`, `AUTH_FAILURE`.
* Captures actor name, role, IP address, user agent, old snapshot, and new snapshot.
* Admin-only **Audit Logs Page** with filters, search, and activity metrics.

---

## 4. Authentication & RBAC Architecture

* **Bcrypt Password Hashing**: Passwords hashed with salt factor 10.
* **Stateless JWT Tokens**: Signed with HMAC SHA-256 (`JWT_EXPIRES_IN=7d`).
* **Role-Based Access Control**:
  * `Admin`: Full permissions (Add, Edit, Delete, Stock Adjustments, Audit Logs).
  * `Staff`: Operational permissions (View, Search, Filter, Stock Adjustments). `DELETE` and `/audit-logs` return `HTTP 403 Forbidden`.

---

## 5. Key Features

### 🛡️ Role Permissions Matrix

| Feature / Action | Admin Role | Staff Role | Unauthenticated |
| :--- | :---: | :---: | :---: |
| **Sign Up & Sign In** | ✅ | ✅ | ✅ |
| **Inventory Dashboard & Alerts** | ✅ | ✅ | ❌ *(Redirects to Login)* |
| **View Catalog & Product Details** | ✅ | ✅ | ❌ *(Redirects to Login)* |
| **Adjust Stock Quantity** | ✅ | ✅ | ❌ *(Redirects to Login)* |
| **Add New Product** | ✅ | ❌ *(Restricted)* | ❌ *(Redirects to Login)* |
| **Edit Product Details** | ✅ | ✅ | ❌ *(Redirects to Login)* |
| **Delete Product** | ✅ | ❌ *(HTTP 403 Forbidden)* | ❌ *(Redirects to Login)* |
| **View System Audit Logs** | ✅ | ❌ *(HTTP 403 Forbidden)* | ❌ *(Redirects to Login)* |

---

## 6. Technology Stack

### Frontend
* **Core**: React.js 18 with Vite
* **Routing**: React Router DOM v6
* **State & Auth**: React Context API (`AuthContext`, `ToastContext`)
* **API Client**: Axios (configured with JWT interceptors)
* **Icons**: Lucide React
* **Styling**: Vanilla CSS3 Design System with Glassmorphism, CSS variables, and responsive layout

### Backend
* **Runtime**: Node.js & Express.js
* **Security & Auth**: `bcryptjs` (password hashing), `jsonwebtoken` (JWT tokens)
* **Database**: MongoDB with Mongoose v8 ODM
* **Utilities**: CORS, Morgan, Dotenv

---

## 7. Project Structure

```text
product-management-system/
│
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection with Mongoose
│   ├── controllers/
│   │   ├── auditController.js     # Audit log queries and metrics
│   │   ├── authController.js      # Register, Login, GetMe controllers
│   │   └── productController.js   # Product CRUD, stock adjust, stock history, stats
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification & req.user attachment
│   │   ├── errorMiddleware.js     # Centralized 404 & error handlers
│   │   └── roleMiddleware.js      # RBAC permission checks (HTTP 403)
│   ├── models/
│   │   ├── AuditLog.js            # Audit log schema and indexes
│   │   ├── Product.js             # Product schema, threshold, virtuals
│   │   ├── StockHistory.js        # Stock history movement schema
│   │   └── User.js                # User schema, bcrypt hooks, JWT generator
│   ├── routes/
│   │   ├── auditRoutes.js         # /api/audit-logs routes
│   │   ├── authRoutes.js          # /api/auth routes
│   │   └── productRoutes.js       # /api/products & stock routes
│   ├── tests/
│   │   ├── api.test.js            # Product API test suite (31 tests)
│   │   ├── audit.test.js          # Audit log test suite (17 tests)
│   │   ├── auth.test.js           # Auth & RBAC test suite (18 tests)
│   │   └── stock.test.js          # Advanced Stock Management test suite (17 tests)
│   ├── utils/
│   │   └── auditLogger.js         # Asynchronous audit event recorder
│   ├── .env                       # Environment configuration
│   ├── package.json               # Backend dependencies & scripts
│   ├── seed.js                    # Database seeder
│   └── server.js                  # Express app entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CategoryFilter.jsx
│   │   │   ├── DashboardCard.jsx
│   │   │   ├── DeleteConfirmation.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductForm.jsx
│   │   │   ├── ProductTable.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── SortDropdown.jsx
│   │   │   ├── StockBadge.jsx
│   │   │   ├── StockHistoryChart.jsx # SVG stock trend chart
│   │   │   └── StockUpdateModal.jsx  # Dedicated stock adjustment modal
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── pages/
│   │   │   ├── AddProduct.jsx
│   │   │   ├── AuditLogs.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EditProduct.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── ProductDetails.jsx
│   │   │   ├── Products.jsx
│   │   │   └── Register.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   ├── App.css
│   │   │   └── index.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 8. Data Models & Schemas

### Product Model (`backend/models/Product.js`)
* `name`: String (Required, 2–100 chars)
* `category`: String (Required)
* `price`: Number (Required, `> 0`)
* `stockQuantity`: Number (Required, integer, `≥ 0`)
* `minStockThreshold`: Number (Configurable minimum stock threshold, default: `5`, min: `1`)
* `description`: String (Required, min 5 chars)
* `stockStatus` (Virtual): `"Out of Stock"` (`0`), `"Low Stock"` (`1–threshold`), `"In Stock"` (`> threshold`)
* `inventoryValue` (Virtual): `(price * stockQuantity)`

### Stock History Model (`backend/models/StockHistory.js`)
* `productId`: ObjectId (Ref: `Product`, indexed)
* `productName`: String
* `previousQuantity`: Number
* `newQuantity`: Number
* `changeAmount`: Number (`+` / `-`)
* `changeType`: Enum (`RESTOCK`, `SALE`, `DAMAGED`, `RETURNED`, `MANUAL_ADJUSTMENT`, `INITIAL_STOCK`)
* `changedBy`: String
* `reason`: String (Required)
* `note`: String
* `timestamp`: Date (Default: `Date.now`, indexed)

---

## 9. REST API Documentation

Base API URL: `http://localhost:5000/api`

### Inventory & Stock Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/products/stats` | Admin, Staff | Dashboard stats including `lowStockAlerts` and threshold counts |
| **POST** | `/api/products/:id/stock` | Admin, Staff | Dedicated stock adjustment with delta calculation and reason validation |
| **GET** | `/api/products/:id/stock-history` | Admin, Staff | Retrieve stock movement timeline for a SKU |
| **GET** | `/api/products` | Admin, Staff | Paginated catalog with search, filter, sort |
| **GET** | `/api/products/:id` | Admin, Staff | Product details with virtual status |
| **POST** | `/api/products` | Admin Only | Create SKU with configurable `minStockThreshold` |
| **PUT** | `/api/products/:id` | Admin, Staff | Update SKU metadata |
| **DELETE** | `/api/products/:id` | Admin Only | Delete SKU |

### Audit Log Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/audit-logs` | Admin Only | Paginated audit log feed with search & filters |
| **GET** | `/api/audit-logs/stats` | Admin Only | Aggregated action breakdown and activity metrics |

---

## 10. Installation & Setup

```bash
# Backend dependencies:
cd backend
npm install

# Frontend dependencies:
cd ../frontend
npm install
```

---

## 11. Running the Application

```bash
# Start backend API (Port 5000)
cd backend
npm run dev

# Start frontend (Port 5173)
cd frontend
npm run dev
```

---

## 12. Automated Testing

Run the full automated test suite:
```bash
cd backend
npm test
```

### Test Suite Results (83 / 83 Passed - 100%):
* ✅ **Auth & RBAC Test Suite**: 18 Passed
* ✅ **Audit Log Test Suite**: 17 Passed
* ✅ **Advanced Stock Management Suite**: 17 Passed
* ✅ **Product API Suite**: 31 Passed
