const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductStats,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  updateStockQuantity,
  getProductStockHistory,
  deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// All product management routes require valid authentication
router.use(protect);

// Dashboard stats & categories (accessible to both Admin and Staff)
router.get('/stats', authorizeRoles('admin', 'staff'), getProductStats);
router.get('/categories', authorizeRoles('admin', 'staff'), getCategories);

// Stock specific routes
router.post('/:id/stock', authorizeRoles('admin', 'staff'), updateStockQuantity);
router.get('/:id/stock-history', authorizeRoles('admin', 'staff'), getProductStockHistory);

// Product list (GET) and Product creation (POST)
router.route('/')
  .get(authorizeRoles('admin', 'staff'), getProducts)
  .post(authorizeRoles('admin'), createProduct);

// Product detail (GET), update (PUT), and delete (DELETE)
router.route('/:id')
  .get(authorizeRoles('admin', 'staff'), getProductById)
  .put(authorizeRoles('admin', 'staff'), updateProduct)
  .delete(authorizeRoles('admin'), deleteProduct); // DELETE is strictly Admin-only

module.exports = router;
