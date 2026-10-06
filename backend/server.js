const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const auditRoutes = require('./routes/auditRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Product Management API is live and healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Authentication & User Management Routes
app.use('/api/auth', authRoutes);

// Protected Product Management Routes
app.use('/api/products', productRoutes);

// Admin-Only Audit Log Routes
app.use('/api/audit-logs', auditRoutes);

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Product Management and Inventory System API with RBAC Auth & Audit Logging',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
      },
      products: {
        list: 'GET /api/products (Protected: Admin, Staff)',
        stats: 'GET /api/products/stats (Protected: Admin, Staff)',
        categories: 'GET /api/products/categories (Protected: Admin, Staff)',
        byId: 'GET /api/products/:id (Protected: Admin, Staff)',
        create: 'POST /api/products (Protected: Admin)',
        update: 'PUT /api/products/:id (Protected: Admin, Staff)',
        delete: 'DELETE /api/products/:id (Protected: Admin Only)',
      },
      auditLogs: {
        list: 'GET /api/audit-logs (Protected: Admin Only)',
        stats: 'GET /api/audit-logs/stats (Protected: Admin Only)',
        byId: 'GET /api/audit-logs/:id (Protected: Admin Only)',
      },
    },
  });
});

// Centralized 404 & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Server] Product Management Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`[Server] API Base URL: http://localhost:${PORT}/api`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Process terminated');
  });
});

module.exports = app;
