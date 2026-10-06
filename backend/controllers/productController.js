const { Product, GLOBAL_STOCK_CONFIG } = require('../models/Product');
const StockHistory = require('../models/StockHistory');
const { logAuditEvent } = require('../utils/auditLogger');

/**
 * @desc    Get all products with search, filter, sort, and pagination
 * @route   GET /api/products
 * @access  Private (Admin, Staff)
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      search = '',
      category = '',
      sort = 'newest',
      page = 1,
      limit = 10,
      stockStatus = '',
    } = req.query;

    // Build filter query
    const filter = {};

    // Search by product name (case-insensitive)
    if (search && search.trim() !== '') {
      const sanitizedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: sanitizedSearch, $options: 'i' };
    }

    // Filter by category
    if (category && category.trim() !== '' && category.toLowerCase() !== 'all' && category.toLowerCase() !== 'all categories') {
      filter.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }

    // Optional stock status filter
    if (stockStatus) {
      if (stockStatus === 'out-of-stock') {
        filter.stockQuantity = 0;
      } else if (stockStatus === 'low-stock') {
        filter.$expr = {
          $and: [
            { $gt: ['$stockQuantity', 0] },
            { $lte: ['$stockQuantity', { $ifNull: ['$minStockThreshold', GLOBAL_STOCK_CONFIG.DEFAULT_LOW_STOCK_THRESHOLD] }] },
          ],
        };
      } else if (stockStatus === 'in-stock') {
        filter.$expr = {
          $gt: ['$stockQuantity', { $ifNull: ['$minStockThreshold', GLOBAL_STOCK_CONFIG.DEFAULT_LOW_STOCK_THRESHOLD] }],
        };
      }
    }

    // Sorting logic
    let sortOptions = { createdAt: -1 }; // default: newest first
    switch (sort) {
      case 'name_asc':
      case 'name-asc':
        sortOptions = { name: 1 };
        break;
      case 'name_desc':
      case 'name-desc':
        sortOptions = { name: -1 };
        break;
      case 'price_asc':
      case 'price-asc':
        sortOptions = { price: 1 };
        break;
      case 'price_desc':
      case 'price-desc':
        sortOptions = { price: -1 };
        break;
      case 'stock_asc':
      case 'stock-asc':
        sortOptions = { stockQuantity: 1 };
        break;
      case 'stock_desc':
      case 'stock-desc':
        sortOptions = { stockQuantity: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    // Pagination calculations
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    // Fetch total matching count and paginated items
    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean({ virtuals: true }),
    ]);

    const totalPages = Math.ceil(totalProducts / limitNum) || 1;

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: {
        products,
        pagination: {
          totalProducts,
          totalPages,
          currentPage: pageNum,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard statistics, low stock alerts, and category breakdown
 * @route   GET /api/products/stats
 * @access  Private (Admin, Staff)
 */
const getProductStats = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();

    // Aggregation for total stock and total inventory value
    const aggregateMetrics = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalStock: { $sum: '$stockQuantity' },
          totalInventoryValue: {
            $sum: { $multiply: ['$price', '$stockQuantity'] },
          },
          avgPrice: { $avg: '$price' },
        },
      },
    ]);

    const totalStock = aggregateMetrics[0]?.totalStock || 0;
    const totalInventoryValue = Number((aggregateMetrics[0]?.totalInventoryValue || 0).toFixed(2));
    const avgPrice = Number((aggregateMetrics[0]?.avgPrice || 0).toFixed(2));

    // Low stock & Out of stock counts using dynamic threshold per item
    const outOfStockCount = await Product.countDocuments({ stockQuantity: 0 });

    const lowStockProductsList = await Product.find({
      $expr: {
        $lte: ['$stockQuantity', { $ifNull: ['$minStockThreshold', GLOBAL_STOCK_CONFIG.DEFAULT_LOW_STOCK_THRESHOLD] }],
      },
    })
      .sort({ stockQuantity: 1 })
      .lean({ virtuals: true });

    const lowStockCount = lowStockProductsList.filter((p) => p.stockQuantity > 0).length;
    const inStockCount = Math.max(0, totalProducts - outOfStockCount - lowStockCount);

    // Formatted real-time alert notifications
    const lowStockAlerts = lowStockProductsList.map((p) => {
      const threshold = p.minStockThreshold || GLOBAL_STOCK_CONFIG.DEFAULT_LOW_STOCK_THRESHOLD;
      if (p.stockQuantity === 0) {
        return {
          id: p._id,
          name: p.name,
          category: p.category,
          stock: 0,
          threshold,
          type: 'OUT_OF_STOCK',
          message: `${p.name} is out of stock. (0 units remaining)`,
        };
      } else {
        return {
          id: p._id,
          name: p.name,
          category: p.category,
          stock: p.stockQuantity,
          threshold,
          type: 'LOW_STOCK',
          message: `${p.name} stock is low. Current stock: ${p.stockQuantity} (Threshold: ${threshold})`,
        };
      }
    });

    // Category breakdown
    const categoryBreakdown = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stockQuantity' },
          totalValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          category: '$_id',
          count: 1,
          totalStock: 1,
          totalValue: { $round: ['$totalValue', 2] },
          _id: 0,
        },
      },
    ]);

    // Recently added products (6 latest)
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .lean({ virtuals: true });

    const totalCategories = categoryBreakdown.length;

    const stockStatusDistribution = [
      { status: 'In Stock', count: inStockCount, percentage: totalProducts > 0 ? Number(((inStockCount / totalProducts) * 100).toFixed(1)) : 0, color: '#10b981' },
      { status: 'Low Stock', count: lowStockCount, percentage: totalProducts > 0 ? Number(((lowStockCount / totalProducts) * 100).toFixed(1)) : 0, color: '#f59e0b' },
      { status: 'Out of Stock', count: outOfStockCount, percentage: totalProducts > 0 ? Number(((outOfStockCount / totalProducts) * 100).toFixed(1)) : 0, color: '#ef4444' },
    ];

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        totalProducts,
        totalStock,
        totalInventoryValue,
        avgPrice,
        totalCategories,
        lowStockCount,
        outOfStockCount,
        inStockCount,
        stockStatusDistribution,
        categoryBreakdown,
        recentProducts,
        lowStockProducts: lowStockProductsList.slice(0, 10),
        lowStockAlerts,
        globalConfig: GLOBAL_STOCK_CONFIG,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all distinct categories
 * @route   GET /api/products/categories
 * @access  Private (Admin, Staff)
 */
const getCategories = async (req, res, next) => {
  try {
    const rawCategories = await Product.distinct('category');
    const categories = rawCategories
      .filter((cat) => cat && typeof cat === 'string')
      .map((cat) => cat.trim())
      .sort((a, b) => a.localeCompare(b));

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Private (Admin, Staff)
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).lean({ virtuals: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID '${id}' not found`,
        errors: [{ message: 'The requested product does not exist in inventory' }],
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private (Admin Only)
 */
const createProduct = async (req, res, next) => {
  try {
    const { name, category, price, stockQuantity, minStockThreshold = 5, description } = req.body;

    const validationErrors = [];

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      validationErrors.push({ field: 'name', message: 'Product name is required' });
    } else if (name.trim().length < 2) {
      validationErrors.push({ field: 'name', message: 'Product name must be at least 2 characters long' });
    } else if (name.trim().length > 100) {
      validationErrors.push({ field: 'name', message: 'Product name cannot exceed 100 characters' });
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      validationErrors.push({ field: 'category', message: 'Category is required' });
    }

    const parsedPrice = Number(price);
    if (price === undefined || price === null || isNaN(parsedPrice) || parsedPrice <= 0) {
      validationErrors.push({ field: 'price', message: 'Price must be a number greater than 0' });
    }

    const parsedStock = Number(stockQuantity);
    if (
      stockQuantity === undefined ||
      stockQuantity === null ||
      isNaN(parsedStock) ||
      !Number.isInteger(parsedStock) ||
      parsedStock < 0
    ) {
      validationErrors.push({
        field: 'stockQuantity',
        message: 'Stock quantity must be an integer and cannot be negative (0 or greater)',
      });
    }

    const parsedThreshold = Number(minStockThreshold) || 5;
    if (!Number.isInteger(parsedThreshold) || parsedThreshold < 1) {
      validationErrors.push({
        field: 'minStockThreshold',
        message: 'Minimum stock threshold must be an integer of 1 or greater',
      });
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      validationErrors.push({ field: 'description', message: 'Description is required' });
    } else if (description.trim().length < 5) {
      validationErrors.push({ field: 'description', message: 'Description must be at least 5 characters long' });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please verify all product details.',
        errors: validationErrors,
      });
    }

    const newProduct = new Product({
      name: name.trim(),
      category: category.trim(),
      price: parsedPrice,
      stockQuantity: parsedStock,
      minStockThreshold: parsedThreshold,
      description: description.trim(),
    });

    const savedProduct = await newProduct.save();

    // Record initial StockHistory
    await StockHistory.create({
      productId: savedProduct._id,
      productName: savedProduct.name,
      previousQuantity: 0,
      newQuantity: savedProduct.stockQuantity,
      changeAmount: savedProduct.stockQuantity,
      changeType: 'INITIAL_STOCK',
      changedBy: req.user?.name || 'Administrator',
      changedById: req.user?._id || null,
      reason: 'Initial Product Stock Entry',
    });

    // Automatically record Audit Log
    await logAuditEvent({
      req,
      action: 'PRODUCT_CREATE',
      entityType: 'Product',
      entityId: savedProduct._id,
      description: `Created product "${savedProduct.name}" (Initial stock: ${savedProduct.stockQuantity} units, Threshold: ${savedProduct.minStockThreshold})`,
      newData: savedProduct.toJSON({ virtuals: true }),
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: savedProduct.toJSON({ virtuals: true }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing product
 * @route   PUT /api/products/:id
 * @access  Private (Admin, Staff)
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, price, stockQuantity, minStockThreshold, description } = req.body;

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: `Product with ID '${id}' not found`,
        errors: [{ message: 'Cannot update non-existing product' }],
      });
    }

    const validationErrors = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        validationErrors.push({ field: 'name', message: 'Product name is required' });
      } else if (name.trim().length < 2) {
        validationErrors.push({ field: 'name', message: 'Product name must be at least 2 characters long' });
      } else if (name.trim().length > 100) {
        validationErrors.push({ field: 'name', message: 'Product name cannot exceed 100 characters' });
      }
    }

    if (category !== undefined) {
      if (typeof category !== 'string' || category.trim().length === 0) {
        validationErrors.push({ field: 'category', message: 'Category is required' });
      }
    }

    if (price !== undefined) {
      const parsedPrice = Number(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        validationErrors.push({ field: 'price', message: 'Price must be a number greater than 0' });
      }
    }

    if (stockQuantity !== undefined) {
      const parsedStock = Number(stockQuantity);
      if (isNaN(parsedStock) || !Number.isInteger(parsedStock) || parsedStock < 0) {
        validationErrors.push({
          field: 'stockQuantity',
          message: 'Stock quantity must be an integer and cannot be negative (0 or greater)',
        });
      }
    }

    if (minStockThreshold !== undefined) {
      const parsedThreshold = Number(minStockThreshold);
      if (isNaN(parsedThreshold) || !Number.isInteger(parsedThreshold) || parsedThreshold < 1) {
        validationErrors.push({
          field: 'minStockThreshold',
          message: 'Minimum stock threshold must be an integer of 1 or greater',
        });
      }
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0) {
        validationErrors.push({ field: 'description', message: 'Description is required' });
      } else if (description.trim().length < 5) {
        validationErrors.push({ field: 'description', message: 'Description must be at least 5 characters long' });
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please verify the updated product details.',
        errors: validationErrors,
      });
    }

    const previousStock = existingProduct.stockQuantity;
    const oldSnapshot = existingProduct.toJSON({ virtuals: true });

    // Apply updates
    if (name !== undefined) existingProduct.name = name.trim();
    if (category !== undefined) existingProduct.category = category.trim();
    if (price !== undefined) existingProduct.price = Number(price);
    if (stockQuantity !== undefined) existingProduct.stockQuantity = Number(stockQuantity);
    if (minStockThreshold !== undefined) existingProduct.minStockThreshold = Number(minStockThreshold);
    if (description !== undefined) existingProduct.description = description.trim();

    const updatedProduct = await existingProduct.save();

    // If stock quantity changed during standard edit, record StockHistory
    if (stockQuantity !== undefined && Number(stockQuantity) !== previousStock) {
      const newStock = Number(stockQuantity);
      const delta = newStock - previousStock;
      await StockHistory.create({
        productId: updatedProduct._id,
        productName: updatedProduct.name,
        previousQuantity: previousStock,
        newQuantity: newStock,
        changeAmount: delta,
        changeType: delta > 0 ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
        changedBy: req.user?.name || 'Inventory User',
        changedById: req.user?._id || null,
        reason: req.body.reason || 'General product detail update',
      });
    }

    // Automatically record Audit Log
    const changes = [];
    if (stockQuantity !== undefined && Number(stockQuantity) !== previousStock) {
      changes.push(`stock changed from ${previousStock} to ${updatedProduct.stockQuantity}`);
    }
    if (price !== undefined && Number(price) !== oldSnapshot.price) {
      changes.push(`price changed from $${oldSnapshot.price} to $${updatedProduct.price}`);
    }
    const changeSummary = changes.length > 0 ? ` (${changes.join(', ')})` : '';

    await logAuditEvent({
      req,
      action: 'PRODUCT_UPDATE',
      entityType: 'Product',
      entityId: updatedProduct._id,
      description: `Updated product "${updatedProduct.name}"${changeSummary}`,
      oldData: oldSnapshot,
      newData: updatedProduct.toJSON({ virtuals: true }),
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct.toJSON({ virtuals: true }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Dedicated Stock Quantity Adjustment endpoint
 * @route   POST /api/products/:id/stock
 * @access  Private (Admin, Staff)
 */
const updateStockQuantity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newQuantity, reason, changeType, note = '' } = req.body;

    const validationErrors = [];

    const parsedQty = Number(newQuantity);
    if (
      newQuantity === undefined ||
      newQuantity === null ||
      isNaN(parsedQty) ||
      !Number.isInteger(parsedQty) ||
      parsedQty < 0
    ) {
      validationErrors.push({
        field: 'newQuantity',
        message: 'New quantity must be a non-negative integer (0 or greater)',
      });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      validationErrors.push({
        field: 'reason',
        message: 'Reason for stock adjustment is required',
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock adjustment validation failed',
        errors: validationErrors,
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID '${id}' not found`,
        errors: [{ message: 'Cannot adjust stock for non-existing product' }],
      });
    }

    const previousQuantity = product.stockQuantity;
    const targetQuantity = parsedQty;
    const changeAmount = targetQuantity - previousQuantity;

    // Determine changeType
    let resolvedChangeType = changeType;
    if (!resolvedChangeType) {
      const normalizedReason = reason.trim().toUpperCase();
      if (normalizedReason.includes('RESTOCK')) resolvedChangeType = 'RESTOCK';
      else if (normalizedReason.includes('SALE')) resolvedChangeType = 'SALE';
      else if (normalizedReason.includes('DAMAGED')) resolvedChangeType = 'DAMAGED';
      else if (normalizedReason.includes('RETURN')) resolvedChangeType = 'RETURNED';
      else if (changeAmount > 0) resolvedChangeType = 'RESTOCK';
      else if (changeAmount < 0) resolvedChangeType = 'SALE';
      else resolvedChangeType = 'MANUAL_ADJUSTMENT';
    }

    // Update product stock
    product.stockQuantity = targetQuantity;
    const updatedProduct = await product.save();

    // Create StockHistory record
    const historyEntry = await StockHistory.create({
      productId: product._id,
      productName: product.name,
      previousQuantity,
      newQuantity: targetQuantity,
      changeAmount,
      changeType: resolvedChangeType,
      changedBy: req.user?.name || 'Inventory Manager',
      changedById: req.user?._id || null,
      reason: reason.trim(),
      note: note.trim(),
    });

    // Record Audit Log
    const sign = changeAmount >= 0 ? '+' : '';
    await logAuditEvent({
      req,
      action: 'STOCK_UPDATE',
      entityType: 'Product',
      entityId: product._id,
      description: `Stock for "${product.name}" changed from ${previousQuantity} to ${targetQuantity} (${sign}${changeAmount}) • Reason: ${reason.trim()}`,
      oldData: { stockQuantity: previousQuantity },
      newData: { stockQuantity: targetQuantity, reason: reason.trim(), changeType: resolvedChangeType },
    });

    res.status(200).json({
      success: true,
      message: `Stock updated successfully: ${previousQuantity} ➔ ${targetQuantity} units`,
      data: {
        product: updatedProduct.toJSON({ virtuals: true }),
        stockHistory: historyEntry,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get stock history for a specific product
 * @route   GET /api/products/:id/stock-history
 * @access  Private (Admin, Staff)
 */
const getProductStockHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await StockHistory.find({ productId: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      message: 'Product stock history retrieved',
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a product by ID
 * @route   DELETE /api/products/:id
 * @access  Private (Admin Only)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: `Product with ID '${id}' not found`,
        errors: [{ message: 'Cannot delete non-existing product' }],
      });
    }

    // Automatically record Audit Log
    await logAuditEvent({
      req,
      action: 'PRODUCT_DELETE',
      entityType: 'Product',
      entityId: deletedProduct._id,
      description: `Deleted product "${deletedProduct.name}" (Category: "${deletedProduct.category}", Stock: ${deletedProduct.stockQuantity})`,
      oldData: deletedProduct.toJSON({ virtuals: true }),
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: {
        id: deletedProduct._id,
        name: deletedProduct.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductStats,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  updateStockQuantity,
  getProductStockHistory,
  deleteProduct,
};
