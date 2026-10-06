const AuditLog = require('../models/AuditLog');

/**
 * Safely extracts client IP address from Express request
 */
const getClientIp = (req) => {
  if (!req) return '127.0.0.1';
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
  );
};

/**
 * Safely extracts user agent from Express request
 */
const getUserAgent = (req) => {
  if (!req || !req.headers) return 'Unknown';
  return req.headers['user-agent'] || 'Unknown';
};

/**
 * Log an audit event to MongoDB asynchronously
 * @param {Object} params
 * @param {Object} [params.req] - Express request object (optional)
 * @param {string} params.action - Event action code (e.g. 'PRODUCT_CREATE')
 * @param {string} [params.entityType='Product'] - Type of entity ('Product', 'User', 'Auth', 'System')
 * @param {string} [params.entityId] - ID of the entity affected
 * @param {string} params.description - Human-readable narrative description
 * @param {Object} [params.oldData] - Previous snapshot state (for updates/deletes)
 * @param {Object} [params.newData] - New snapshot state (for creates/updates)
 * @param {Object} [params.user] - Explicit user override (if req.user not yet set)
 */
const logAuditEvent = async ({
  req = null,
  action,
  entityType = 'Product',
  entityId = null,
  description,
  oldData = null,
  newData = null,
  user = null,
}) => {
  try {
    const actor = user || req?.user || null;
    const userId = actor?._id || actor?.id || null;
    const userName = actor?.name || (req?.body?.email ? `User (${req.body.email})` : 'Anonymous / System');
    const userRole = actor?.role || 'guest';
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const logEntry = new AuditLog({
      userId,
      userName,
      userRole,
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      description,
      oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
      newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
      ipAddress,
      userAgent,
    });

    await logEntry.save();
    return logEntry;
  } catch (error) {
    // Non-blocking logging failure error output
    console.error('[Audit Logger Error] Failed to record audit log entry:', error.message);
    return null;
  }
};

module.exports = {
  logAuditEvent,
  getClientIp,
};
