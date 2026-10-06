const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userName: {
      type: String,
      required: true,
      default: 'System / Anonymous',
      trim: true,
    },
    userRole: {
      type: String,
      required: true,
      default: 'guest',
      trim: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      enum: [
        'USER_REGISTER',
        'USER_LOGIN',
        'USER_LOGOUT',
        'AUTH_FAILURE',
        'PRODUCT_CREATE',
        'PRODUCT_UPDATE',
        'STOCK_UPDATE',
        'PRODUCT_DELETE',
        'SYSTEM_EVENT',
      ],
    },
    entityType: {
      type: String,
      required: true,
      enum: ['Product', 'User', 'Auth', 'System'],
      default: 'Product',
    },
    entityId: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    oldData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: 'Unknown',
    },
    userAgent: {
      type: String,
      default: 'Unknown',
    },
  },
  {
    timestamps: true,
  }
);

// High performance indexes for sorting, filtering, and search queries
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ userId: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
