const mongoose = require('mongoose');

// Global default threshold constants
const GLOBAL_STOCK_CONFIG = {
  OUT_OF_STOCK: 0,
  DEFAULT_LOW_STOCK_THRESHOLD: 5,
};

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters long'],
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      minlength: [1, 'Category cannot be empty'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      validate: {
        validator: function (val) {
          return typeof val === 'number' && !isNaN(val) && val > 0;
        },
        message: 'Price must be a valid number greater than 0',
      },
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      validate: {
        validator: function (val) {
          return Number.isInteger(val) && val >= 0;
        },
        message: 'Stock quantity must be a non-negative integer (0 or greater)',
      },
    },
    minStockThreshold: {
      type: Number,
      default: 5,
      validate: {
        validator: function (val) {
          return Number.isInteger(val) && val >= 1;
        },
        message: 'Minimum stock threshold must be an integer of 1 or greater',
      },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [5, 'Description must be at least 5 characters long'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property to calculate stock status dynamically with configurable threshold
productSchema.virtual('stockStatus').get(function () {
  const threshold = typeof this.minStockThreshold === 'number' && this.minStockThreshold > 0
    ? this.minStockThreshold
    : GLOBAL_STOCK_CONFIG.DEFAULT_LOW_STOCK_THRESHOLD;

  if (this.stockQuantity === GLOBAL_STOCK_CONFIG.OUT_OF_STOCK) {
    return 'Out of Stock';
  } else if (this.stockQuantity <= threshold) {
    return 'Low Stock';
  } else {
    return 'In Stock';
  }
});

// Virtual property to calculate total inventory value for the product
productSchema.virtual('inventoryValue').get(function () {
  return Number((this.price * this.stockQuantity).toFixed(2));
});

// Virtual flag indicating if stock is currently low or depleted
productSchema.virtual('isLowStock').get(function () {
  const threshold = typeof this.minStockThreshold === 'number' && this.minStockThreshold > 0
    ? this.minStockThreshold
    : GLOBAL_STOCK_CONFIG.DEFAULT_LOW_STOCK_THRESHOLD;
  return this.stockQuantity <= threshold;
});

// Index for high-performance case-insensitive searching and category filtering
productSchema.index({ name: 'text', category: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ stockQuantity: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = {
  Product,
  GLOBAL_STOCK_CONFIG,
};
