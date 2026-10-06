const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    previousQuantity: {
      type: Number,
      required: [true, 'Previous quantity is required'],
      min: [0, 'Previous quantity cannot be negative'],
    },
    newQuantity: {
      type: Number,
      required: [true, 'New quantity is required'],
      min: [0, 'New quantity cannot be negative'],
    },
    changeAmount: {
      type: Number,
      required: true,
    },
    changeType: {
      type: String,
      required: true,
      enum: [
        'RESTOCK',
        'SALE',
        'DAMAGED',
        'RETURNED',
        'MANUAL_ADJUSTMENT',
        'INITIAL_STOCK',
        'OTHER',
      ],
      default: 'MANUAL_ADJUSTMENT',
    },
    changedBy: {
      type: String,
      required: true,
      default: 'System / User',
      trim: true,
    },
    changedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reason: {
      type: String,
      required: [true, 'Adjustment reason is required'],
      trim: true,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

stockHistorySchema.index({ productId: 1, createdAt: -1 });
stockHistorySchema.index({ createdAt: -1 });

const StockHistory = mongoose.model('StockHistory', stockHistorySchema);

module.exports = StockHistory;
